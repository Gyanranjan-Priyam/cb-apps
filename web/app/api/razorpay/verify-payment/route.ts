import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_id,
      signature,
    } = body;

    const finalOrderId = razorpay_order_id || order_id;
    const finalPaymentId = razorpay_payment_id || payment_id;
    const finalSignature = razorpay_signature || signature;

    if (!finalOrderId || !finalPaymentId || !finalSignature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required verification parameters (order_id, payment_id, signature).",
        },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature({
      orderId: finalOrderId,
      paymentId: finalPaymentId,
      signature: finalSignature,
    });

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed: Invalid signature.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      payment_id: finalPaymentId,
      order_id: finalOrderId,
    });
  } catch (error: any) {
    console.error("Razorpay payment verification error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error during verification" },
      { status: 500 }
    );
  }
}
