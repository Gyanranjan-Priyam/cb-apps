import { NextRequest, NextResponse } from "next/server";
import { requireAdminAPI } from "@/app/data/admin/require-admin-api";
import { sendEmail } from "@/lib/mailer";

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdminAPI();

    const formData = await request.formData();
    const to = formData.get("to") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const attachmentFiles = formData.getAll("attachments") as File[];

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, or message" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Process attachments if any
    const attachments = await Promise.all(
      attachmentFiles.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return {
          filename: file.name,
          content: Buffer.from(buffer),
          contentType: file.type,
        };
      })
    );

    // Prepare email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="message-content">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>This email was sent from CodeBreakers Club Admin Panel</p>
            <p>© ${new Date().getFullYear()} CodeBreakers Club. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendEmail({
      to,
      subject,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Email sent successfully" 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 }
    );
  }
}
