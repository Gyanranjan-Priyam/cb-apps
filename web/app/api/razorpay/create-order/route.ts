import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt, notes } = body;

    // Amount validation (amount expected in paise or rupee depending on caller, let's normalize)
    // Minimum 100 paise (₹1)
    const amountInPaise = Number(amount);

    if (isNaN(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount. Minimum amount must be at least ₹1.00 (100 paise).",
        },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();

    const options = {
      amount: Math.round(amountInPaise),
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);

    if (error?.statusCode === 401 || error?.error?.code === "BAD_REQUEST_ERROR") {
      return NextResponse.json(
        { success: false, error: error?.error?.description || "Razorpay authentication or validation error" },
        { status: error?.statusCode || 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
