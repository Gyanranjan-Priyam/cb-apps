import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { S3 } from "@/lib/s3Client";
import { env } from "@/lib/env";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uniqueKey = `${uuidv4()}-${file.name}`;

    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      ContentType: file.type || "application/octet-stream",
      ContentLength: buffer.length,
      Key: uniqueKey,
      Body: buffer,
    });

    await S3.send(command);

    return NextResponse.json({
      success: true,
      key: uniqueKey,
    });
  } catch (error) {
    console.error("Direct S3 upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file directly to S3" },
      { status: 500 }
    );
  }
}
