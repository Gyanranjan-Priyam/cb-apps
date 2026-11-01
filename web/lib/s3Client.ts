import "server-only";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./env";


export const S3 = new S3Client({
    region: env.AWS_REGION,
    endpoint: env.AWS_ENDPOINT_URL_S3,
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false,
})

// Function to get file buffer from S3
export async function getFileFromS3(fileKey: string, bucketType: 'images' | 'files' = 'files'): Promise<Buffer> {
  try {
    const bucketName = bucketType === 'images' ? 
      process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES : 
      process.env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    const response = await S3.send(command);
    
    if (!response.Body) {
      throw new Error('File not found');
    }

    // Convert the response body to Buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error getting file from S3:', error);
    throw error;
  }
}
