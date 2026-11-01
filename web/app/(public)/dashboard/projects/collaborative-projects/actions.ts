"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { mailer } from "@/lib/mailer";

export async function getCollaborativeProjects() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const projects = await prisma.projectReview.findMany({
      where: {
        reviewType: "collaboration",
        status: "approved",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            githubUsername: true,
            profileImageKey: true,
            image: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return {
      success: true,
      projects,
      currentUserId: session?.user?.id || null,
      currentUserEmail: session?.user?.email || null,
    };
  } catch (error) {
    console.error("Error fetching collaborative projects:", error);
    return {
      success: false,
      projects: [],
      currentUserId: null,
      currentUserEmail: null,
      message: "Failed to fetch collaborative projects",
    };
  }
}

export async function sendCollaborationEmail({
  toEmail,
  toName,
  fromEmail,
  subject,
  message,
  projectName,
}: {
  toEmail: string;
  toName: string;
  fromEmail: string;
  subject: string;
  message: string;
  projectName: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .message-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .badge { display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🤝 Collaboration Request</h2>
            </div>
            <div class="content">
              <p>Hi <strong>${toName}</strong>,</p>
              <p>You have received a collaboration request for your project:</p>
              <p><span class="badge">${projectName}</span></p>
              
              <div class="message-box">
                <h3 style="margin-top: 0; color: #3b82f6;">Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              
              <p><strong>From:</strong> ${fromEmail}</p>
              
              <p>You can reply directly to this email to start the collaboration discussion.</p>
            </div>
            <div class="footer">
              <p>This email was sent from CodeBreaker Dashboard</p>
              <p>© ${new Date().getFullYear()} CodeBreaker. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await mailer.sendMail({
      to: toEmail,
      subject: subject,
      html: emailHtml,
      replyTo: fromEmail,
    });

    return {
      success: true,
      message: "Message sent successfully!",
    };
  } catch (error) {
    console.error("Error sending collaboration email:", error);
    return {
      success: false,
      message: "Failed to send message. Please try again.",
    };
  }
}
