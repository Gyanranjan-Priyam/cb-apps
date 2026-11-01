import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { GoogleDriveService } from "@/lib/google-drive-service";
import { isSystemAdminRole } from "@/lib/member-roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string; fileId: string }> }
) {
  try {
    const { formId, fileId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !isSystemAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const fileRecord = await prisma.formFile.findFirst({
      where: {
        id: fileId,
      },
      include: {
        form: {
          select: { formId: true, createdById: true },
        },
      },
    });

    if (!fileRecord || (fileRecord.form.formId !== formId && fileRecord.formId !== formId)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { accessToken } = await GoogleDriveService.getValidAccessToken();
    const driveFile = await GoogleDriveService.getFile(fileRecord.googleDriveFileId, accessToken);

    const isDownload = request.nextUrl.searchParams.get("download") === "true";
    const disposition = isDownload ? "attachment" : "inline";

    return new NextResponse(driveFile.buffer as any, {
      status: 200,
      headers: {
        "Content-Type": fileRecord.mimeType || driveFile.mimeType || "application/octet-stream",
        "Content-Length": driveFile.buffer.byteLength.toString(),
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(
          fileRecord.storedFileName || fileRecord.originalFileName
        )}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Error serving form file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve file" },
      { status: 500 }
    );
  }
}
