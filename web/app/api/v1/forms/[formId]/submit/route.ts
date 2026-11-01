import { NextRequest, NextResponse } from "next/server";
import { FormService } from "@/services/form.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { emitSocketEvent } from "@/lib/socket";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { answers, transactionId, paymentStatus } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "Answers payload is required" },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const result = await FormService.submitResponse({
      formId,
      answers,
      submittedById: session?.user?.id,
      transactionId,
      paymentStatus,
    });

    // Notify admin live feed
    await emitSocketEvent(`form-${formId}`, "new-response", {
      responseId: result.response.id,
      formId: result.form.id,
      submittedAt: result.response.createdAt,
    });

    return NextResponse.json({
      success: true,
      message: "Form response submitted successfully",
      response: result.response,
    }, { status: 201 });
  } catch (error: any) {
    console.error("V1 submit form error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to submit form response" },
      { status: 400 }
    );
  }
}
