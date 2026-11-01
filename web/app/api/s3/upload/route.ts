import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import {z} from "zod";
import { v4 as uuidv4 } from 'uuid';
import { S3 } from "@/lib/s3Client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";


export const fileUploadSchema = z.object({
    fileName: z.string().min(1, {message: "File name is required"}),
    contentType: z.string().min(1, {message: "Content type is required"}),
    size: z.number().min(1, {message: "File size is required"}),
    isImage: z.boolean(),
    isPdf: z.boolean().optional(),
    })

    const aj = arcjet
    .withRule(
        fixedWindow({
            mode: 'LIVE',
            window: '1m',
            max: 5,
        })
    )

export async function POST(request: Request) {

        // Check if user is authenticated (not necessarily admin)
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
        }

    try {

        const decision = await aj.protect(request, {
            fingerprint: session?.user.id as string,
        });

        if (decision.isDenied()) {
            return NextResponse.json({error: "Too many requests"}, {status: 420});
        }

        const body = await request.json();

        const validation = fileUploadSchema.safeParse(body);
        if(!validation.success) {
            return NextResponse.json(
                {error: "Invalid request body"},
                {status: 400}
            );
        }
        const {fileName, contentType, size} = validation.data;

        const uniqueKey = `${uuidv4()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
            ContentType: contentType,
            ContentLength: size,
            Key: uniqueKey
        });

        const preSignedUrl = await getSignedUrl(S3, command, {
            expiresIn: 360, // 6 minutes
        });

        const response = {
            preSignedUrl,
            key: uniqueKey,
        };
        return NextResponse.json(response);
    } catch {
        return NextResponse.json(
            { error: "Failed to generate pre-signed URL" },
            { status: 500 }
        );
    }
}