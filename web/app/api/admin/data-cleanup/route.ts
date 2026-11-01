import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { S3 } from "@/lib/s3Client";
import { requireAdminAPI } from "@/app/data/admin/require-admin-api";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

interface DataCleanupOptions {
  participants: boolean;
  users: boolean;
  payments: boolean;
  s3Files: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await requireAdminAPI();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const options: DataCleanupOptions = await request.json();
    const deletedItems: string[] = [];
    const s3FilesToDelete: string[] = [];

    // Pre-collect S3 file keys before transaction to reduce transaction time
    if (options.s3Files) {
      if (options.users) {
        const userProfiles = await prisma.user.findMany({
          where: { 
            role: { not: "admin" }
          },
          select: { profileImageKey: true }
        });
        userProfiles.forEach((user: { profileImageKey: string | null }) => {
          if (user.profileImageKey) s3FilesToDelete.push(user.profileImageKey);
        });
      }
    }

    // Start a transaction for database operations with extended timeout
    await prisma.$transaction(async (tx) => {
      
      // 1. Clean up participants (quiz attempts, event participation, task submissions, attendance)
      if (options.participants) {
        // Delete quiz-related data
        await tx.quizSetAssignment.deleteMany({});
        await tx.quizAttempt.deleteMany({});
        deletedItems.push("Quiz attempts and set assignments");

        // Delete event participation
        await tx.eventParticipation.deleteMany({});
        deletedItems.push("Event participations");

        // Delete task submissions
        await tx.taskSubmission.deleteMany({});
        deletedItems.push("Task submissions");

        // Delete attendance records
        await tx.attendance.deleteMany({});
        deletedItems.push("Attendance records");
      }

      // 2. Clean up non-admin users if selected (do this last)
      if (options.users) {
        // Delete non-admin users (this will cascade delete related data due to foreign keys)
        const deletedUsers = await tx.user.deleteMany({
          where: { 
            role: { not: "admin" }
          }
        });
        deletedItems.push(`${deletedUsers.count} non-admin users`);
      }
    }, {
      timeout: 30000, // 30 seconds timeout
    });

    // Clean up S3 files if selected and there are files to delete
    if (options.s3Files && s3FilesToDelete.length > 0) {
      try {
        // Remove duplicates
        const uniqueFiles = [...new Set(s3FilesToDelete)];
        
        // AWS S3 delete objects in batches (max 1000 per request)
        const batchSize = 1000;
        let totalDeleted = 0;

        for (let i = 0; i < uniqueFiles.length; i += batchSize) {
          const batch = uniqueFiles.slice(i, i + batchSize);
          
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Delete: {
              Objects: batch.map(key => ({ Key: key })),
              Quiet: false
            }
          });

          const result = await S3.send(deleteCommand);
          totalDeleted += result.Deleted?.length || 0;
        }

        deletedItems.push(`${totalDeleted} S3 files`);
      } catch (s3Error) {
        console.error("S3 cleanup error:", s3Error);
        // Don't fail the entire operation if S3 cleanup fails
        deletedItems.push("S3 files (partial - some files may not have been deleted)");
      }
    }

    const message = deletedItems.length > 0 
      ? `Successfully cleaned up: ${deletedItems.join(", ")}`
      : "No data was selected for cleanup";

    return NextResponse.json({
      success: true,
      message,
      deletedItems,
      s3FilesDeleted: s3FilesToDelete.length
    });

  } catch (error) {
    console.error("Data cleanup error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clean up data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}