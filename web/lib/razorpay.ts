import Razorpay from "razorpay";
import crypto from "crypto";

// Server-side Razorpay instance
let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing in environment variables.");
    }

    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }

  return razorpayInstance;
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error("RAZORPAY_KEY_SECRET is not set in environment.");
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

/**
 * Calculates gross amount to charge user so that after Razorpay 2% fee + 18% GST (2.36% total),
 * the admin/merchant receives the exact base amount.
 * 
 * Formula: Total = Base / (1 - 0.0236) = Base / 0.9764
 */
export function calculateRazorpayAmountWithTaxes(baseAmount: number) {
  if (!baseAmount || baseAmount <= 0) {
    return {
      baseAmount: 0,
      feeAndGst: 0,
      totalAmount: 0,
      totalAmountInPaise: 0,
    };
  }
  const deductionRate = 0.0236; // 2% + (18% of 2% = 0.36%)
  const totalAmount = Number((baseAmount / (1 - deductionRate)).toFixed(2));
  const feeAndGst = Number((totalAmount - baseAmount).toFixed(2));
  const totalAmountInPaise = Math.round(totalAmount * 100);

  return {
    baseAmount,
    feeAndGst,
    totalAmount,
    totalAmountInPaise,
  };
}

