import assert from "node:assert";
import QRCode from "qrcode";
import jsQR from "jsqr";
import {
  buildUpiUri,
  parseUpiUri,
  validateUpiUri,
  formatUpiAmount,
  getUpiAppLinks,
  UpiPaymentConfig,
} from "../lib/upi";

console.log("==========================================");
console.log("  RUNNING UPI PAYMENT URI & QR TEST SUITE ");
console.log("==========================================\n");

let passedCount = 0;
let totalCount = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  totalCount++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          console.log(`  ✓ PASS: ${name}`);
          passedCount++;
        })
        .catch((err) => {
          console.error(`  ✗ FAIL: ${name}`);
          console.error(`    Error: ${err.message}`);
          process.exitCode = 1;
        });
    } else {
      console.log(`  ✓ PASS: ${name}`);
      passedCount++;
    }
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    process.exitCode = 1;
  }
}

/**
 * Helper to generate QR PNG and decode with jsQR
 */
async function decodeGeneratedQr(uri: string): Promise<string> {
  // Generate raw pixel data from qrcode
  const qr = QRCode.create(uri, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const margin = 4;
  const totalSize = size + margin * 2;
  const scale = 4;
  const canvasWidth = totalSize * scale;
  const canvasHeight = totalSize * scale;

  // Create RGBA buffer
  const rgbaBuffer = new Uint8ClampedArray(canvasWidth * canvasHeight * 4);

  // Initialize white background
  rgbaBuffer.fill(255);

  // Draw black modules
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (qr.modules.get(r, c)) {
        const startX = (c + margin) * scale;
        const startY = (r + margin) * scale;
        for (let y = startY; y < startY + scale; y++) {
          for (let x = startX; x < startX + scale; x++) {
            const index = (y * canvasWidth + x) * 4;
            rgbaBuffer[index] = 0; // R
            rgbaBuffer[index + 1] = 0; // G
            rgbaBuffer[index + 2] = 0; // B
            rgbaBuffer[index + 3] = 255; // A
          }
        }
      }
    }
  }

  const code = jsQR(rgbaBuffer, canvasWidth, canvasHeight);
  if (!code) {
    throw new Error("jsQR failed to decode generated QR code");
  }
  return code.data;
}

async function runAllTests() {
  // Test Case 1: Personal UPI
  runTest("Test Case 1: Personal UPI ID without merchant parameters", () => {
    const config: UpiPaymentConfig = {
      vpa: "example@upi",
      payeeName: "Test User",
      amount: 100,
      currency: "INR",
    };

    const uri = buildUpiUri(config);
    assert(uri.startsWith("upi://pay?"), "URI must start with upi://pay?");

    const parsed = parseUpiUri(uri);
    assert.strictEqual(parsed.valid, true);
    assert.strictEqual(parsed.params.pa, "example@upi");
    assert.strictEqual(parsed.params.pn, "Test User");
    assert.strictEqual(parsed.params.am, "100.00");
    assert.strictEqual(parsed.params.cu, "INR");
    assert.strictEqual(parsed.params.mc, undefined, "mc must NOT be present for personal UPI");

    const validation = validateUpiUri(uri, config);
    assert.strictEqual(validation.valid, true, "Validation against expected config must pass");
  });

  // Test Case 2: SBI Personal VPA & QR Decode Round-trip
  await runTest("Test Case 2: SBI Personal VPA and QR Decode Round-trip", async () => {
    const config: UpiPaymentConfig = {
      vpa: "example@sbi",
      payeeName: "Test User",
      amount: 1,
      currency: "INR",
    };

    const uri = buildUpiUri(config);
    assert(uri.startsWith("upi://pay?"));

    const parsed = parseUpiUri(uri);
    assert.strictEqual(parsed.params.pa, "example@sbi");
    assert.strictEqual(parsed.params.pn, "Test User");
    assert.strictEqual(parsed.params.am, "1.00");
    assert.strictEqual(parsed.params.cu, "INR");
    assert.strictEqual(parsed.params.mc, undefined);

    // QR Round trip decode test
    const decoded = await decodeGeneratedQr(uri);
    assert.strictEqual(decoded, uri, "Decoded QR data must exactly match the generated UPI URI");

    const parsedDecoded = parseUpiUri(decoded);
    assert.strictEqual(parsedDecoded.valid, true);
    assert.strictEqual(parsedDecoded.params.pa, "example@sbi");
    assert.strictEqual(parsedDecoded.params.am, "1.00");
  });

  // Test Case 3: Merchant VPA without official MCC
  runTest("Test Case 3: Merchant VPA without official MCC (No fake MCC)", () => {
    const config: UpiPaymentConfig = {
      vpa: "merchant@sbi",
      payeeName: "Test Merchant",
      amount: 100,
      currency: "INR",
      merchant: {
        enabled: true,
        mcc: undefined,
      },
    };

    const uri = buildUpiUri(config);
    const parsed = parseUpiUri(uri);

    assert.strictEqual(parsed.params.pa, "merchant@sbi");
    assert.strictEqual(parsed.params.pn, "Test Merchant");
    assert.strictEqual(parsed.params.am, "100.00");
    assert.strictEqual(parsed.params.cu, "INR");
    assert.strictEqual(parsed.params.mc, undefined, "Must NOT insert fake 0000 or fabricated MCC");
  });

  // Test Case 4: Merchant VPA with official MCC and Transaction Reference
  await runTest("Test Case 4: Merchant VPA with official MCC and Transaction Reference", async () => {
    const config: UpiPaymentConfig = {
      vpa: "merchant@sbi",
      payeeName: "Test Merchant",
      amount: 100,
      currency: "INR",
      transactionReference: "ORDER12345",
      merchant: {
        enabled: true,
        mcc: "5411",
        merchantId: "MID998877",
      },
    };

    const uri = buildUpiUri(config);
    const parsed = parseUpiUri(uri);

    assert.strictEqual(parsed.params.pa, "merchant@sbi");
    assert.strictEqual(parsed.params.pn, "Test Merchant");
    assert.strictEqual(parsed.params.am, "100.00");
    assert.strictEqual(parsed.params.cu, "INR");
    assert.strictEqual(parsed.params.mc, "5411");
    assert.strictEqual(parsed.params.tr, "ORDER12345");
    assert.strictEqual(parsed.params.mid, "MID998877");

    // QR Round-trip
    const decoded = await decodeGeneratedQr(uri);
    assert.strictEqual(decoded, uri);
    const parsedDecoded = parseUpiUri(decoded);
    assert.strictEqual(parsedDecoded.params.mc, "5411");
    assert.strictEqual(parsedDecoded.params.tr, "ORDER12345");
  });

  // Test Case 5: Special characters in Payee Name
  await runTest("Test Case 5: Special characters encoding (ABC & XYZ Pvt. Ltd.)", async () => {
    const config: UpiPaymentConfig = {
      vpa: "store@hdfcbank",
      payeeName: "ABC & XYZ Pvt. Ltd.",
      amount: 250.75,
      currency: "INR",
    };

    const uri = buildUpiUri(config);
    const parsed = parseUpiUri(uri);

    assert.strictEqual(parsed.params.pn, "ABC & XYZ Pvt. Ltd.");

    const decoded = await decodeGeneratedQr(uri);
    const parsedDecoded = parseUpiUri(decoded);
    assert.strictEqual(parsedDecoded.params.pn, "ABC & XYZ Pvt. Ltd.");
  });

  // Test Case 6: Amount formatting edge cases
  runTest("Test Case 6: Amount formatting edge cases", () => {
    assert.strictEqual(formatUpiAmount(1), "1.00");
    assert.strictEqual(formatUpiAmount(1.5), "1.50");
    assert.strictEqual(formatUpiAmount(1.5), "1.50");
    assert.strictEqual(formatUpiAmount(100), "100.00");
    assert.strictEqual(formatUpiAmount(100.5), "100.50");
    assert.strictEqual(formatUpiAmount(99999.99), "99999.99");
    assert.strictEqual(formatUpiAmount(undefined), null);
    assert.strictEqual(formatUpiAmount(null), null);
    assert.strictEqual(formatUpiAmount(0), null);

    // Test variable amount URI (am omitted)
    const varConfig: UpiPaymentConfig = {
      vpa: "donate@upi",
      payeeName: "Charity Foundation",
      currency: "INR",
    };
    const varUri = buildUpiUri(varConfig);
    const varParsed = parseUpiUri(varUri);
    assert.strictEqual(varParsed.params.am, undefined, "Variable amount must omit am parameter");
  });

  // Test Case 7: Mobile App Deep Links
  runTest("Test Case 7: Mobile App Deep Link Generator", () => {
    const config: UpiPaymentConfig = {
      vpa: "user@okhdfcbank",
      payeeName: "Test Seller",
      amount: 50,
      currency: "INR",
    };

    const links = getUpiAppLinks(config);
    assert(links.universalUri.startsWith("upi://pay?"));
    assert.strictEqual(links.apps.length, 5);

    const gpay = links.apps.find((a) => a.id === "gpay");
    assert(gpay && gpay.schemeUrl.startsWith("gpay://upi/pay?"));

    const phonepe = links.apps.find((a) => a.id === "phonepe");
    assert(phonepe && phonepe.schemeUrl.startsWith("phonepe://pay?"));

    const paytm = links.apps.find((a) => a.id === "paytm");
    assert(paytm && paytm.schemeUrl.startsWith("paytmmp://pay?"));
  });

  console.log("\n==========================================");
  console.log(`  RESULTS: ${passedCount}/${totalCount} tests passed`);
  console.log("==========================================\n");

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
