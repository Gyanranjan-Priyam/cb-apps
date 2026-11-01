import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
 
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url().min(1),
    GMAIL_USER: z.string().min(1),
    GMAIL_APP_PASSWORD: z.string().min(1),
    GMAIL_FROM_NAME: z.string().optional(),
    BACKUP_GMAIL_USER: z.string().optional(),
    BACKUP_GMAIL_APP_PASSWORD: z.string().optional(),
    BACKUP_GMAIL_FROM_NAME: z.string().optional(),
    SMTP_PRIMARY_HOST: z.string().optional(),
    SMTP_PRIMARY_PORT: z.string().optional(),
    SMTP_BACKUP_HOST: z.string().optional(),
    SMTP_BACKUP_PORT: z.string().optional(),
    DAILY_EMAIL_LIMIT: z.string().optional(),
    AUTH_GITHUB_CLIENT_ID: z.string().min(1),
    AUTH_GITHUB_CLIENT_SECRET: z.string().min(1),
    AUTH_GOOGLE_CLIENT_ID: z.string().min(1),
    AUTH_GOOGLE_CLIENT_SECRET: z.string().min(1),
    AUTH_DISCORD_CLIENT_ID: z.string().min(1),
    AUTH_DISCORD_CLIENT_SECRET: z.string().min(1),
    ARCJET_KEY: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_REGION: z.string().min(1),
    AWS_ENDPOINT_URL_S3: z.string().min(1),
    AWS_ENDPOINT_URL_IAM: z.string().min(1),
    API_KEY: z.string().min(32).optional(),
  },

  client: {
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: z.string().min(1),
    NEXT_PUBLIC_S3_BUCKET_NAME_FILES: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url().min(1),
  },

  // For Next.js >= 13.4.4, you only need to destructure client variables:
    experimental__runtimeEnv: {
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES || "",
    NEXT_PUBLIC_S3_BUCKET_NAME_FILES: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES || "",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
  }
});