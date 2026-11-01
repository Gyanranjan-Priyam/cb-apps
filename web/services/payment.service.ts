import { getRazorpayClient, verifyRazorpaySignature } from "@/lib/razorpay";
import { PaymentRepository } from "@/repositories/payment.repository";

export class PaymentService {
  /**
   * Create Razorpay payment order
   */
  static async createOrder(params: {
    amount: number; // in paise
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
  }) {
    const { amount, currency = "INR", receipt, notes } = params;
    const amountInPaise = Math.round(Number(amount));

    if (isNaN(amountInPaise) || amountInPaise < 100) {
      throw new Error("Invalid amount. Minimum payment amount is ₹1.00 (100 paise).");
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      notes: notes || {},
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    };
  }

  /**
   * Verify Razorpay payment signature
   */
  static verifySignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    return verifyRazorpaySignature({
      orderId: params.orderId,
      paymentId: params.paymentId,
      signature: params.signature,
    });
  }

  /**
   * Verify and confirm payment for form response or transaction
   */
  static async confirmPayment(params: {
    orderId: string;
    paymentId: string;
    signature: string;
    responseId?: string;
  }) {
    const isValid = this.verifySignature({
      orderId: params.orderId,
      paymentId: params.paymentId,
      signature: params.signature,
    });

    if (!isValid) {
      return { success: false, error: "Payment verification failed: Invalid signature." };
    }

    let updatedResponse = null;
    if (params.responseId) {
      updatedResponse = await PaymentRepository.updateResponsePaymentStatus(
        params.responseId,
        "completed",
        params.paymentId
      );
    }

    return {
      success: true,
      orderId: params.orderId,
      paymentId: params.paymentId,
      response: updatedResponse,
    };
  }

  /**
   * Get payment history for a user
   */
  static async getUserPaymentHistory(userId: string) {
    return PaymentRepository.getUserPayments(userId);
  }
}
