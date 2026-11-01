import QRCode from "qrcode";

/**
 * Standard UPI Payment Configuration
 */
export interface UpiPaymentConfig {
  /** Payee Virtual Payment Address (e.g. user@okhdfcbank or merchant@sbi) */
  vpa: string;
  /** Payee Name / Business Name (URL encoded when generated) */
  payeeName: string;
  /** Optional payment amount (in INR) - formatted to 2 decimal places if provided */
  amount?: number;
  /** Currency code - defaults to INR */
  currency?: "INR" | string;
  /** Transaction Reference ID / Order ID (tr) */
  transactionReference?: string;
  /** Transaction Note / Description (tn) */
  transactionNote?: string;
  /** Merchant-specific parameters (mc, merchantId, terminalId) */
  merchant?: {
    enabled?: boolean;
    mcc?: string;
    merchantId?: string;
    terminalId?: string;
  };
}

/**
 * Parsed UPI Parameters Representation
 */
export interface ParsedUpiUri {
  valid: boolean;
  rawUri: string;
  params: {
    pa?: string;
    pn?: string;
    am?: string;
    cu?: string;
    tr?: string;
    tn?: string;
    mc?: string;
    mid?: string;
    tid?: string;
    [key: string]: string | undefined;
  };
  error?: string;
}

/**
 * Clean & sanitize string input
 */
function sanitizeString(str: string): string {
  return str.trim().replace(/[\r\n\t]+/g, " ");
}

/**
 * Formats a monetary amount to 2 decimal places if valid.
 * Returns null if amount is undefined, null, or not a positive number.
 */
export function formatUpiAmount(amount: number | undefined | null): string | null {
  if (amount === undefined || amount === null) {
    return null;
  }
  const num = Number(amount);
  if (isNaN(num) || num <= 0) {
    return null;
  }
  // Standard NPCI UPI accepts 2 decimal places (e.g. 1.00, 100.50)
  return num.toFixed(2);
}

/**
 * Builds a standards-compliant UPI payment URI (upi://pay?...)
 *
 * Rules:
 * - `pa` (mandatory): Payee VPA
 * - `pn` (mandatory): Payee Name (properly URL-encoded)
 * - `cu` (mandatory): Currency (defaults to INR)
 * - `am` (optional): Formatted to 2 decimals when fixed amount is specified
 * - `tr` (optional): Transaction reference when provided
 * - `tn` (optional): Transaction note when provided
 * - `mc` (optional): Merchant Category Code ONLY if merchant.enabled is true and official mcc is provided
 * - NEVER injects fake or default MCC like "0000"
 */
export function buildUpiUri(config: UpiPaymentConfig): string {
  if (!config.vpa || !config.vpa.trim()) {
    throw new Error("UPI VPA (pa) is mandatory");
  }

  const vpa = sanitizeString(config.vpa);
  const payeeName = sanitizeString(config.payeeName || "Payment");
  const currency = config.currency || "INR";

  const params = new URLSearchParams();

  // Mandatory fields
  params.set("pa", vpa);
  params.set("pn", payeeName);
  params.set("cu", currency);

  // Amount formatting (2 decimal places)
  const formattedAmount = formatUpiAmount(config.amount);
  if (formattedAmount !== null) {
    params.set("am", formattedAmount);
  }

  // Transaction Reference / Order ID
  if (config.transactionReference && config.transactionReference.trim()) {
    params.set("tr", sanitizeString(config.transactionReference));
  }

  // Transaction Note
  if (config.transactionNote && config.transactionNote.trim()) {
    params.set("tn", sanitizeString(config.transactionNote));
  }

  // Merchant Parameters - ONLY if officially supplied & enabled
  if (config.merchant?.enabled) {
    const mcc = config.merchant.mcc?.trim();
    if (mcc && /^\d{4}$/.test(mcc) && mcc !== "0000") {
      params.set("mc", mcc);
    }

    if (config.merchant.merchantId?.trim()) {
      params.set("mid", sanitizeString(config.merchant.merchantId));
    }

    if (config.merchant.terminalId?.trim()) {
      params.set("tid", sanitizeString(config.merchant.terminalId));
    }
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Parses a UPI URI and extracts its parameters
 */
export function parseUpiUri(uri: string): ParsedUpiUri {
  if (!uri || typeof uri !== "string") {
    return { valid: false, rawUri: uri || "", params: {}, error: "Empty or invalid URI string" };
  }

  const match = uri.match(/^upi:\/\/pay\?(.*)$/i);
  if (!match) {
    return {
      valid: false,
      rawUri: uri,
      params: {},
      error: "URI does not start with standard upi://pay? scheme",
    };
  }

  const queryString = match[1];
  const searchParams = new URLSearchParams(queryString);
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  if (!params.pa) {
    return { valid: false, rawUri: uri, params, error: "Missing mandatory 'pa' parameter" };
  }

  return {
    valid: true,
    rawUri: uri,
    params,
  };
}

/**
 * Validates a UPI URI against expected payment configuration
 */
export function validateUpiUri(
  uri: string,
  expectedConfig: UpiPaymentConfig
): {
  valid: boolean;
  checks: { name: string; passed: boolean; details?: string }[];
} {
  const parsed = parseUpiUri(uri);
  const checks: { name: string; passed: boolean; details?: string }[] = [];

  if (!parsed.valid) {
    checks.push({
      name: "URI Scheme",
      passed: false,
      details: parsed.error || "Invalid scheme",
    });
    return { valid: false, checks };
  }

  checks.push({ name: "URI Scheme", passed: true, details: "Starts with upi://pay?" });

  // VPA check
  const vpaMatch = parsed.params.pa?.toLowerCase() === expectedConfig.vpa.trim().toLowerCase();
  checks.push({
    name: "VPA (pa)",
    passed: vpaMatch,
    details: `Expected: ${expectedConfig.vpa}, Found: ${parsed.params.pa}`,
  });

  // Payee name check
  const expectedPayee = (expectedConfig.payeeName || "Payment").trim();
  const payeeMatch = parsed.params.pn === expectedPayee;
  checks.push({
    name: "Payee Name (pn)",
    passed: payeeMatch,
    details: `Expected: "${expectedPayee}", Found: "${parsed.params.pn}"`,
  });

  // Currency check
  const expectedCu = expectedConfig.currency || "INR";
  const cuMatch = parsed.params.cu === expectedCu;
  checks.push({
    name: "Currency (cu)",
    passed: cuMatch,
    details: `Expected: ${expectedCu}, Found: ${parsed.params.cu}`,
  });

  // Amount check
  if (expectedConfig.amount !== undefined && expectedConfig.amount !== null && expectedConfig.amount > 0) {
    const expectedAm = formatUpiAmount(expectedConfig.amount);
    const amMatch = parsed.params.am === expectedAm;
    checks.push({
      name: "Amount (am)",
      passed: amMatch,
      details: `Expected: ${expectedAm}, Found: ${parsed.params.am}`,
    });
  } else {
    checks.push({
      name: "Amount (am)",
      passed: !parsed.params.am,
      details: parsed.params.am ? `Unexpected am=${parsed.params.am}` : "Variable amount (omitted)",
    });
  }

  // Merchant MCC check
  if (expectedConfig.merchant?.enabled && expectedConfig.merchant.mcc) {
    const mcMatch = parsed.params.mc === expectedConfig.merchant.mcc.trim();
    checks.push({
      name: "Merchant MCC (mc)",
      passed: mcMatch,
      details: `Expected: ${expectedConfig.merchant.mcc}, Found: ${parsed.params.mc}`,
    });
  } else {
    const noMc = !parsed.params.mc;
    checks.push({
      name: "Merchant MCC (mc) not added for personal/unconfigured",
      passed: noMc,
      details: noMc ? "No MCC injected" : `Injected MCC: ${parsed.params.mc}`,
    });
  }

  // Transaction Reference check
  if (expectedConfig.transactionReference) {
    const trMatch = parsed.params.tr === expectedConfig.transactionReference.trim();
    checks.push({
      name: "Transaction Ref (tr)",
      passed: trMatch,
      details: `Expected: ${expectedConfig.transactionReference}, Found: ${parsed.params.tr}`,
    });
  }

  const allPassed = checks.every((c) => c.passed);
  return { valid: allPassed, checks };
}

/**
 * Generates high-resolution DataURL for QR Code directly via local qrcode library
 */
export async function generateUpiQrDataUrl(
  config: UpiPaymentConfig,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  const uri = buildUpiUri(config);
  return QRCode.toDataURL(uri, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    ...options,
  });
}

/**
 * Mobile UPI app deep link definitions
 */
export interface UpiAppOption {
  id: string;
  name: string;
  schemeUrl: string;
  color: string;
  badge?: string;
}

/**
 * Returns mobile deep links for major UPI apps with universal fallback
 */
export function getUpiAppLinks(config: UpiPaymentConfig): {
  universalUri: string;
  apps: UpiAppOption[];
} {
  const universalUri = buildUpiUri(config);
  const parsed = parseUpiUri(universalUri);
  const query = new URLSearchParams(parsed.params as Record<string, string>).toString();

  return {
    universalUri,
    apps: [
      {
        id: "generic",
        name: "Pay with any UPI App",
        schemeUrl: universalUri,
        color: "#0f766e",
        badge: "Universal",
      },
      {
        id: "gpay",
        name: "Google Pay",
        schemeUrl: `gpay://upi/pay?${query}`,
        color: "#4285F4",
      },
      {
        id: "phonepe",
        name: "PhonePe",
        schemeUrl: `phonepe://pay?${query}`,
        color: "#5f259f",
      },
      {
        id: "paytm",
        name: "Paytm",
        schemeUrl: `paytmmp://pay?${query}`,
        color: "#00baf2",
      },
      {
        id: "bhim",
        name: "BHIM",
        schemeUrl: `bhim://pay?${query}`,
        color: "#005a9c",
      },
    ],
  };
}
