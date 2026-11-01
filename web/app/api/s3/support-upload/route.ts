import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { S3 } from "@/lib/s3Client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const supportFileUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().min(1, "File size is required").max(10 * 1024 * 1024, "File size must be less than 10MB"),
  folder: z.string().optional().default("support-tickets"),
});

const aj = arcjet.withRule(
  fixedWindow({
    mode: 'LIVE',
    window: '1m',
    max: 10,
  })
);

// Allowed file types for support tickets
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 
  'text/csv'
];

export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Rate limiting
    const decision = await aj.protect(request, {
      fingerprint: session.user.id,
    });

    if (decision.isDenied()) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Validate request body
    const body = await request.json();
    const validation = supportFileUploadSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid request body",
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { fileName, fileType, fileSize, folder } = validation.data;

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: `File type '${fileType}' is not supported` },
        { status: 400 }
      );
    }

    // Generate unique file key with folder structure
    const uniqueKey = `${folder}/${session.user.id}/${uuidv4()}-${fileName}`;

    // Create S3 upload command
    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: uniqueKey,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        userId: session.user.id,
        originalFileName: fileName,
        uploadedBy: 'support-system',
      },
    });

    // Generate pre-signed URL
    const signedUrl = await getSignedUrl(S3, command, {
      expiresIn: 600, // 10 minutes
    });

    const response = {
      signedUrl,
      fileKey: uniqueKey,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("S3 upload error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}