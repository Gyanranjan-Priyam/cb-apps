import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { S3 } from '@/lib/s3Client';
import { env } from '@/lib/env';
import { headers } from 'next/headers';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'profile', 'payment', or 'support'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type based on upload type
    let allowedTypes: string[];
    let maxSize: number;
    
    if (type === 'profile') {
      allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      maxSize = 5 * 1024 * 1024; // 5MB
    } else if (type === 'payment') {
      allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      maxSize = 5 * 1024 * 1024; // 5MB
    } else if (type === 'support') {
      allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      maxSize = 10 * 1024 * 1024; // 10MB
    } else {
      allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      maxSize = 5 * 1024 * 1024; // 5MB
    }
      
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Only images, PDFs, documents, and archives are allowed for support attachments.` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `File size too large. Maximum ${maxSizeMB}MB allowed.` },
        { status: 400 }
      );
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();

    if (type === 'profile') {
      // Upload profile images to S3
      const fileName = `profiles/${session.user.id}-${timestamp}-${randomId}.${fileExtension}`;
      const bucketName = env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;

      try {
        const uploadParams = {
          Bucket: bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
          ContentDisposition: 'inline',
          CacheControl: 'max-age=31536000', // 1 year cache
        };

        const command = new PutObjectCommand(uploadParams);
        await S3.send(command);

        return NextResponse.json({
          success: true,
          key: fileName,
          url: `https://${bucketName}.s3.amazonaws.com/${fileName}`,
          message: 'Profile image uploaded successfully',
        });
      } catch (s3Error) {
        console.error('S3 upload error:', s3Error);
        return NextResponse.json(
          { error: 'Failed to upload to cloud storage' },
          { status: 500 }
        );
      }
    } else if (type === 'support') {
      // Upload support ticket attachments to S3
      const fileName = `support-attachments/${session.user.id}-${timestamp}-${randomId}-${file.name}`;
      const bucketName = env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES;

      try {
        const uploadParams = {
          Bucket: bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
          ContentDisposition: 'attachment',
          Metadata: {
            'user-id': session.user.id,
            'original-name': file.name,
            'upload-timestamp': timestamp.toString(),
          },
        };

        const command = new PutObjectCommand(uploadParams);
        await S3.send(command);

        return NextResponse.json({
          success: true,
          fileKey: fileName,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          message: 'Support attachment uploaded successfully',
        });
      } catch (s3Error) {
        console.error('S3 upload error:', s3Error);
        return NextResponse.json(
          { error: 'Failed to upload to cloud storage' },
          { status: 500 }
        );
      }
    } else {
      // Handle payment screenshots (local storage for backward compatibility)
      const fileName = `payment-${session.user.id}-${timestamp}-${randomId}.${fileExtension}`;

      console.log('Uploading payment screenshot:', fileName);

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payments');
      console.log('Upload directory:', uploadsDir);
      
      if (!existsSync(uploadsDir)) {
        console.log('Creating upload directory...');
        await mkdir(uploadsDir, { recursive: true });
      }

      // Save file to local uploads directory
      const filePath = join(uploadsDir, fileName);
      console.log('Saving to:', filePath);
      await writeFile(filePath, buffer);

      console.log('Upload successful:', fileName);
      return NextResponse.json({
        success: true,
        key: fileName,
        message: 'Payment screenshot uploaded successfully',
      });
    }

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}