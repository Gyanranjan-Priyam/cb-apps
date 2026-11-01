import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserRepository } from "@/repositories/user.repository";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserRepository.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const registrationData = {
      fullName: user.name || "",
      email: user.email || "",
      mobileNumber: user.mobileNumber || "",
      whatsappNumber: user.whatsappNumber || "",
      aadhaarNumber: user.aadhaarNumber || "",
      state: user.state || "",
      district: user.district || "",
      collegeName: user.collegeName || "",
      collegeAddress: user.collegeAddress || "",
    };

    return NextResponse.json(registrationData);
  } catch (error) {
    console.error("V1 registration-data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
