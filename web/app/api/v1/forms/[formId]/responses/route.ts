import { NextRequest, NextResponse } from "next/server";
import { FormService } from "@/services/form.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !hasAdminOrCoAdminAccess(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { formId } = await params;
    const responses = await FormService.getFormResponses(formId);

    return NextResponse.json({ success: true, responses });
  } catch (error: any) {
    console.error("V1 form responses error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch form responses" },
      { status: 500 }
    );
  }
}
