import { NextRequest, NextResponse } from "next/server";
import { FormService } from "@/services/form.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasAdminOrCoAdminAccess } from "@/lib/member-roles";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get("all") === "true";

    let onlyPublished = true;
    if (all) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user && hasAdminOrCoAdminAccess(session.user.role)) {
        onlyPublished = false;
      }
    }

    const forms = await FormService.listForms(onlyPublished);
    return NextResponse.json({ success: true, forms });
  } catch (error: any) {
    console.error("V1 forms list error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
