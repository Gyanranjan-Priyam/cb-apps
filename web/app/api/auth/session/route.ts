import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ session: null });
  }
}