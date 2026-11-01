import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt, notes } = body;

    const orderData = await PaymentService.createOrder({
      amount,
      currency,
      receipt,
      notes,
    });

    return NextResponse.json({
      success: true,
      order_id: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency,
      key_id: orderData.keyId,
    });
  } catch (error: any) {
    console.error("V1 create-order error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create payment order" },
      { status: 400 }
    );
  }
}
