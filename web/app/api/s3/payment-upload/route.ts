import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { S3 } from "@/lib/s3Client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const paymentUploadSchema = z.object({
    fileName: z.string().min(1, { message: "File name is required" }),
    contentType: z.string().min(1, { message: "Content type is required" }),
    size: z.number().min(1, { message: "File size is required" }).max(5 * 1024 * 1024, { message: "File size must be less than 5MB" }),
});

export async function POST(request: Request) {
    try {
        // Check authentication - regular users can upload payment screenshots
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await request.json();

        const validation = paymentUploadSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { fileName, contentType, size } = validation.data;

        // Validate file type for payment screenshots
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(contentType)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPG and PNG images are allowed." },
                { status: 400 }
            );
        }

        // Generate unique key with payment prefix and user ID
        const fileExtension = fileName.split('.').pop() || 'jpg';
        const uniqueKey = `payments/${session.user.id}/${uuidv4()}-${Date.now()}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            ContentType: contentType,
            ContentLength: size,
            Key: uniqueKey
        });

        const preSignedUrl = await getSignedUrl(S3, command, {
            expiresIn: 600, // 10 minutes
        });

        const response = {
            preSignedUrl,
            key: uniqueKey,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Failed to generate pre-signed URL for payment upload:", error);
        return NextResponse.json(
            { error: "Failed to generate pre-signed URL" },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
    );
}