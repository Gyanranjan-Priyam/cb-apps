import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { formSchema } from "@/lib/zodSchema";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true,
        whatsappNumber: true,
        aadhaarNumber: true,
        state: true,
        district: true,
        collegeName: true,
        collegeAddress: true,
        profileComplete: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate the incoming data
    const validation = formSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data provided", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Construct the full name from first, middle, and last name
    const fullName = [data.firstName, data.middleName, data.lastName]
      .filter(Boolean)
      .join(" ");

    // Check if username is already taken (if provided)
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Update user profile with all the collected information
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: fullName,
        email: data.email,
        mobileNumber: data.phone,
        whatsappNumber: data.whatsappNumber || null,
        state: data.state,
        district: data.district,
        
        // Personal Details
        username: data.username || null,
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        
        // Academic Details
        registration: data.registration,
        rollNumber: data.rollNumber,
        branch: data.branch,
        admissionYear: data.admissionYear,
        
        // College Information
        collegeName: data.collegeName,
        collegeAddress: data.collegeAddress,
        
        // Address Details
        address: data.address,
        postOffice: data.postOffice,
        policeStation: data.policeStation,
        block: data.block,
        pinCode: data.pinCode,
        
        // Mark profile as complete
        profileComplete: true,
        
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profile created successfully!",
        data: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating user profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile. Please try again." },
      { status: 500 }
    );
  }
}