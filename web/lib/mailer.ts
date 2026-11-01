/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import { env } from "./env";
import { type JSONContent } from "@tiptap/react";

import { prisma } from "./db";

// 1. Primary SMTP Transporter
const primaryTransporter = nodemailer.createTransport(
  env.SMTP_PRIMARY_HOST
    ? {
        host: env.SMTP_PRIMARY_HOST,
        port: parseInt(env.SMTP_PRIMARY_PORT || "587", 10),
        secure: env.SMTP_PRIMARY_PORT === "465",
        auth: {
          user: env.GMAIL_USER,
          pass: env.GMAIL_APP_PASSWORD,
        },
      }
    : {
        service: "gmail",
        auth: {
          user: env.GMAIL_USER,
          pass: env.GMAIL_APP_PASSWORD,
        },
      },
);

// 2. Backup / Secondary SMTP Transporter (if configured)
const backupUser =
  process.env.BACKUP_GMAIL_USER || process.env.SMTP_BACKUP_USER;
const backupPass =
  process.env.BACKUP_GMAIL_APP_PASSWORD || process.env.SMTP_BACKUP_PASS;
const hasBackupSmtp = Boolean(backupUser && backupPass);

const backupTransporter = hasBackupSmtp
  ? nodemailer.createTransport(
      process.env.SMTP_BACKUP_HOST
        ? {
            host: process.env.SMTP_BACKUP_HOST,
            port: parseInt(process.env.SMTP_BACKUP_PORT || "587", 10),
            secure: process.env.SMTP_BACKUP_PORT === "465",
            auth: {
              user: backupUser,
              pass: backupPass,
            },
          }
        : {
            service: "gmail",
            auth: {
              user: backupUser,
              pass: backupPass,
            },
          },
    )
  : primaryTransporter;

// Daily email quota (Default 100 emails/day on primary before switching)
const DAILY_LIMIT = parseInt(process.env.DAILY_EMAIL_LIMIT || "100", 10);

// In-memory cache for fast tracking
let cachedDateKey = "";
let cachedPrimaryCount = 0;
let cachedBackupCount = 0;

function getTodayDateKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

async function getUsageForToday(): Promise<{
  primarySent: number;
  backupSent: number;
}> {
  const dateKey = getTodayDateKey();

  // If date changed, reset in-memory counts automatically (Daily Refresh)
  if (cachedDateKey !== dateKey) {
    cachedDateKey = dateKey;
    try {
      const record = await prisma.smtpUsageTracker.findUnique({
        where: { dateKey },
      });
      if (record) {
        cachedPrimaryCount = record.primarySent;
        cachedBackupCount = record.backupSent;
      } else {
        cachedPrimaryCount = 0;
        cachedBackupCount = 0;
      }
    } catch {
      cachedPrimaryCount = 0;
      cachedBackupCount = 0;
    }
  }

  return { primarySent: cachedPrimaryCount, backupSent: cachedBackupCount };
}

async function incrementUsage(provider: "PRIMARY" | "BACKUP") {
  const dateKey = getTodayDateKey();
  if (provider === "PRIMARY") {
    cachedPrimaryCount++;
  } else {
    cachedBackupCount++;
  }

  // Persist to database asynchronously
  try {
    await prisma.smtpUsageTracker.upsert({
      where: { dateKey },
      create: {
        dateKey,
        primarySent: provider === "PRIMARY" ? 1 : 0,
        backupSent: provider === "BACKUP" ? 1 : 0,
        activeSmtp:
          cachedPrimaryCount >= DAILY_LIMIT && hasBackupSmtp
            ? "BACKUP"
            : "PRIMARY",
      },
      update: {
        primarySent: provider === "PRIMARY" ? { increment: 1 } : undefined,
        backupSent: provider === "BACKUP" ? { increment: 1 } : undefined,
        activeSmtp:
          cachedPrimaryCount >= DAILY_LIMIT && hasBackupSmtp
            ? "BACKUP"
            : "PRIMARY",
      },
    });
  } catch (err) {
    console.error("[Mailer] Error recording SMTP usage in database:", err);
  }
}

function getFromAddress(
  provider: "PRIMARY" | "BACKUP",
  customFrom?: any,
): string {
  if (customFrom && typeof customFrom === "string") return customFrom;
  if (provider === "BACKUP" && hasBackupSmtp) {
    const fromName =
      process.env.BACKUP_GMAIL_FROM_NAME ||
      process.env.BACKUP_SMTP_FROM_NAME ||
      env.GMAIL_FROM_NAME ||
      "CodeBreakers Club";
    return `"${fromName}" <${backupUser}>`;
  }
  const fromName = env.GMAIL_FROM_NAME || "CodeBreakers Club";
  return `"${fromName}" <${env.GMAIL_USER}>`;
}

// Failover sendMail implementation
async function sendMailWithFailover(
  mailOptions: nodemailer.SendMailOptions,
): Promise<nodemailer.SentMessageInfo> {
  const { primarySent } = await getUsageForToday();
  const shouldSwitchToBackup = hasBackupSmtp && primarySent >= DAILY_LIMIT;

  if (shouldSwitchToBackup) {
    console.log(
      `[Mailer] 🔄 Primary SMTP reached daily limit (${primarySent}/${DAILY_LIMIT}). Routing email to Backup SMTP.`,
    );
    try {
      const optionsWithFrom = {
        ...mailOptions,
        from: mailOptions.from || getFromAddress("BACKUP", mailOptions.from),
      };
      const info = await backupTransporter.sendMail(optionsWithFrom);
      await incrementUsage("BACKUP");
      return info;
    } catch (backupError) {
      console.warn(
        "[Mailer] ⚠️ Backup SMTP failed, falling back to Primary SMTP:",
        backupError,
      );
      const optionsWithFrom = {
        ...mailOptions,
        from: mailOptions.from || getFromAddress("PRIMARY", mailOptions.from),
      };
      const info = await primaryTransporter.sendMail(optionsWithFrom);
      await incrementUsage("PRIMARY");
      return info;
    }
  } else {
    try {
      const optionsWithFrom = {
        ...mailOptions,
        from: mailOptions.from || getFromAddress("PRIMARY", mailOptions.from),
      };
      const info = await primaryTransporter.sendMail(optionsWithFrom);
      await incrementUsage("PRIMARY");
      return info;
    } catch (primaryError: any) {
      console.warn(
        `[Mailer] ⚠️ Primary SMTP failed (${primaryError?.message || primaryError}). Attempting Backup SMTP failover...`,
      );
      if (hasBackupSmtp) {
        const optionsWithFrom = {
          ...mailOptions,
          from: mailOptions.from || getFromAddress("BACKUP", mailOptions.from),
        };
        const info = await backupTransporter.sendMail(optionsWithFrom);
        await incrementUsage("BACKUP");
        return info;
      }
      throw primaryError;
    }
  }
}

// Export mailer interface with failover and status inspection
export const mailer = {
  sendMail: sendMailWithFailover,
  primary: primaryTransporter,
  backup: backupTransporter,
  getUsageStatus: async () => {
    const { primarySent, backupSent } = await getUsageForToday();
    const dateKey = getTodayDateKey();
    return {
      dateKey,
      primarySent,
      backupSent,
      dailyLimit: DAILY_LIMIT,
      activeSmtp:
        primarySent >= DAILY_LIMIT && hasBackupSmtp ? "BACKUP" : "PRIMARY",
      hasBackupConfigured: hasBackupSmtp,
      primaryAccount: env.GMAIL_USER,
      backupAccount: hasBackupSmtp ? backupUser : null,
    };
  },
};

export async function getSmtpUsageStatus() {
  return mailer.getUsageStatus();
}

// Convert TipTap JSON content to HTML for emails
const convertTipTapJSONToHTML = (content: JSONContent): string => {
  if (!content) return "";

  let html = "";

  switch (content.type) {
    case "doc":
      html =
        content.content
          ?.map((node) => convertTipTapJSONToHTML(node))
          .join("") || "";
      break;

    case "paragraph":
      const paragraphContent =
        content.content
          ?.map((node) => convertTipTapJSONToHTML(node))
          .join("") || "";
      const textAlign = content.attrs?.textAlign;
      const style = textAlign
        ? ` style="text-align: ${textAlign}; margin: 12px 0;"`
        : ' style="margin: 12px 0;"';
      html = paragraphContent
        ? `<p${style}>${paragraphContent}</p>`
        : `<p${style}></p>`;
      break;

    case "heading":
      const headingContent =
        content.content
          ?.map((node) => convertTipTapJSONToHTML(node))
          .join("") || "";
      const level = content.attrs?.level || 1;
      const headingTextAlign = content.attrs?.textAlign;
      const headingStyle = headingTextAlign
        ? ` style="text-align: ${headingTextAlign}; margin: 20px 0 12px 0; color: #1f2937;"`
        : ' style="margin: 20px 0 12px 0; color: #1f2937;"';
      html = `<h${level}${headingStyle}>${headingContent}</h${level}>`;
      break;

    case "bulletList":
      const bulletItems =
        content.content
          ?.map((node) => convertTipTapJSONToHTML(node))
          .join("") || "";
      html = `<ul style="margin: 16px 0; padding-left: 24px;">${bulletItems}</ul>`;
      break;

    case "orderedList":
      const orderedItems =
        content.content
          ?.map((node) => convertTipTapJSONToHTML(node))
          .join("") || "";
      html = `<ol style="margin: 16px 0; padding-left: 24px;">${orderedItems}</ol>`;
      break;

    case "listItem":
      const listItemContent =
        content.content
          ?.map((node) => convertTipTapJSONToHTML(node))
          .join("") || "";
      html = `<li style="margin: 4px 0;">${listItemContent}</li>`;
      break;

    case "text":
      let textContent = content.text || "";

      // Apply marks (formatting)
      if (content.marks) {
        content.marks.forEach((mark) => {
          switch (mark.type) {
            case "bold":
              textContent = `<strong>${textContent}</strong>`;
              break;
            case "italic":
              textContent = `<em>${textContent}</em>`;
              break;
            case "code":
              textContent = `<code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-family: monospace;">${textContent}</code>`;
              break;
            case "strike":
              textContent = `<s>${textContent}</s>`;
              break;
            case "underline":
              textContent = `<u>${textContent}</u>`;
              break;
          }
        });
      }

      html = textContent;
      break;

    case "hardBreak":
      html = "<br>";
      break;

    case "codeBlock":
      const codeContent =
        content.content
          ?.map((node) => convertTipTapJSONToHTML(node))
          .join("") || "";
      html = `<pre style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace; margin: 16px 0;"><code>${codeContent}</code></pre>`;
      break;

    case "blockquote":
      const quoteContent =
        content.content
          ?.map((node) => convertTipTapJSONToHTML(node))
          .join("") || "";
      html = `<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6b7280;">${quoteContent}</blockquote>`;
      break;

    default:
      // For unknown types, try to render content if it exists
      if (content.content) {
        html = content.content
          .map((node) => convertTipTapJSONToHTML(node))
          .join("");
      } else if (content.text) {
        html = content.text;
      }
      break;
  }

  return html;
};

// Generate verification email HTML template
const generateVerificationEmailHTML = (verificationCode: string) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeBreakers Email Verification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
            background-color: #f6f8fa;
            padding: 40px 20px;
            color: #24292f;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #d0d7de;
            border-radius: 6px;
        }
        
        .header {
            text-align: center;
            padding: 40px 20px 20px;
        }
        
        .CodeBreakers-logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 24px;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: 600;
            color: #24292f;
            line-height: 1.5;
        }
        
        .content {
            padding: 0 40px 40px;
        }
        
        .code-box {
            background-color: #f6f8fa;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 24px;
            margin: 24px 0;
        }
        
        .code-label {
            font-size: 14px;
            color: #57606a;
            margin-bottom: 16px;
        }
        
        .verification-code {
            font-size: 32px;
            font-weight: 600;
            letter-spacing: 8px;
            color: #24292f;
            text-align: center;
            margin: 16px 0;
            font-family: 'Courier New', monospace;
        }
        
        .info-text {
            font-size: 14px;
            color: #57606a;
            line-height: 1.6;
            margin: 16px 0;
        }
        
        .warning {
            font-weight: 600;
            color: #24292f;
        }
        
        .signature {
            margin-top: 24px;
        }
        
        .signature p {
            font-size: 14px;
            color: #57606a;
            line-height: 1.6;
        }
        
        .disclaimer {
            padding: 24px 40px;
            background-color: #f6f8fa;
            border-top: 1px solid #d0d7de;
            font-size: 12px;
            color: #57606a;
            line-height: 1.6;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #57606a;
        }
        
        .footer-divider {
            margin: 0 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/dw47ib0sh/image/upload/v1764077429/mydzalimrmzbscn0bmue.png" alt="CodeBreakers Logo" class="CodeBreakers-logo" />
            <h1>Please verify your identity for <strong>CodeBreakers</strong></h1>
        </div>
        
        <div class="content">
            <div class="code-box">
                <p class="code-label">Here is your CodeBreakers verification code:</p>
                <div class="verification-code">${verificationCode}</div>
                <p class="info-text">This code is valid for <strong>10 minutes</strong> and can only be used once.</p>
                <p class="info-text"><span class="warning">Please don't share this code with anyone:</span> we'll never ask for it on the phone or via email.</p>
            </div>
            
            <div class="signature">
                <p>Thanks,</p>
                <p>The CodeBreakers Team</p>
            </div>
        </div>
        
        <div class="disclaimer">
            <p>You're receiving this email because a verification code was requested for your CodeBreakers account. If this wasn't you, please ignore this email.</p>
        </div>
    </div>
    
    <div class="footer">
        <p>CodeBreakers 2025 <span class="footer-divider">·</span> Government College of Engineering Kalahandi <span class="footer-divider">·</span> Bhawanipatna, Odisha</p>
    </div>
</body>
</html>`;
};

// Send verification email function with beautiful template
export const sendVerificationEmail = async ({
  to,
  otp,
}: {
  to: string;
  otp: string;
}) => {
  try {
    const html = generateVerificationEmailHTML(otp);

    const info = await mailer.sendMail({
      from: env.GMAIL_FROM_NAME
        ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>`
        : env.GMAIL_USER,
      to,
      subject: "Verify your email address",
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

const generateMemberPortalEmailHTML = ({
  memberName,
  title,
  message,
  ctaLabel,
  ctaUrl,
}: {
  memberName: string;
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
}) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);padding:40px 36px;text-align:center;">
              <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 36px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hello <strong>${memberName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#374151;">${message}</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${ctaUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:10px;">${ctaLabel}</a>
              </div>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">If the button doesn’t work, copy and paste this link into your browser:<br />${ctaUrl}</p>
              <p style="margin:24px 0 0;font-size:15px;line-height:1.8;color:#374151;">Thanks,<br />The CodeBreakers Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const sendMemberInvitationEmail = async ({
  to,
  memberName,
  loginUrl,
}: {
  to: string;
  memberName: string;
  loginUrl: string;
}) => {
  try {
    const html = generateMemberPortalEmailHTML({
      memberName,
      title: "Congratulation!!! You're invited to CodeBreakers",
      message:
        "Your member profile has been created. Use the link below to sign in to your CodeBreakers dashboard and continue your access setup.",
      ctaLabel: "Sign in to your dashboard",
      ctaUrl: loginUrl,
    });

    const info = await mailer.sendMail({
      from: env.GMAIL_FROM_NAME
        ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>`
        : env.GMAIL_USER,
      to,
      subject: "Congratulation!!! You're invited to join CodeBreakers",
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send member invitation email:", error);
    throw error;
  }
};

export const sendMemberWelcomeEmail = async ({
  to,
  memberName,
  dashboardUrl,
}: {
  to: string;
  memberName: string;
  dashboardUrl: string;
}) => {
  return sendWelcomeEmail({
    to,
    firstName: memberName.split(" ")[0] || memberName,
    getStartedUrl: dashboardUrl,
  });
};

// Generate confirmation email HTML template
const generateConfirmationEmailHTML = ({
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  participantEmail,
  registrationDetails,
}: {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  participantEmail: string;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
}) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #333333;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding: 50px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 48px 40px 36px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.4px;">✅ Registration Confirmed!</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">You're all set for the event</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px 40px;">
              <p style="margin: 0 0 24px; font-size: 16px;">Hello <strong>${participantName}</strong>,</p>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #444444;">
                Congratulations! Your registration for <strong>${eventTitle}</strong> has been confirmed. Your payment has been verified and you're officially registered for the event.
              </p>

              <!-- Attachment Notice -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #22c55e; text-align: center;">
                <p style="margin: 0; font-size: 16px; color: #166534; font-weight: 600;">📎 Registration Details Attached</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #166534;">A detailed PDF with your complete registration information is attached to this email for your records.</p>
              </div>

              <!-- Event Details -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #0ea5e9;">
                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #0c4a6e;">📅 Event Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Event:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Venue:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventVenue}</td>
                  </tr>
                </table>
              </div>

              <!-- Registration Details -->
              <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #92400e;">👤 Your Registration Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 140px;">Name:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.fullName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td>
                    <td style="padding: 8px 0; color: #111827;">${participantEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Mobile:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.mobileNumber}</td>
                  </tr>
                  ${
                    registrationDetails.whatsappNumber
                      ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">WhatsApp:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.whatsappNumber}</td>
                  </tr>
                  `
                      : ""
                  }
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">College:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.collegeName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Location:</td>
                    <td style="padding: 8px 0; color: #111827;">${registrationDetails.district}, ${registrationDetails.state}</td>
                  </tr>
                </table>
              </div>

              <!-- Important Instructions -->
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
                <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #dc2626;">📋 Important Instructions</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Please arrive at the venue at least 30 minutes before the event starts</li>
                  <li style="margin-bottom: 8px;">Bring a valid government-issued photo ID for verification</li>
                  <li style="margin-bottom: 8px;">Keep this confirmation email handy for check-in</li>
                  <li style="margin-bottom: 8px;">For any queries, contact our support team using the details below</li>
                </ul>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #444444;">
                We're excited to see you at the event! If you have any questions or need assistance, please don't hesitate to reach out to our team.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="mailto:${env.GMAIL_USER}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Contact Support</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">Need help? Contact us at 
                <a href="mailto:${env.GMAIL_USER}" style="color: #10b981; text-decoration: none;">${env.GMAIL_USER}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">© 2025 ${env.GMAIL_FROM_NAME || "Event Management Platform"}. All rights reserved.</p>
            </td>
          </tr>
        </table>

        <!-- Disclaimer -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This confirmation email was sent automatically. Please keep it for your records.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Send confirmation email function with attachment
export const sendConfirmationEmailWithAttachment = async ({
  to,
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  registrationDetails,
  attachmentBuffer,
  attachmentFilename,
}: {
  to: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
  attachmentBuffer?: Buffer;
  attachmentFilename?: string;
}) => {
  try {
    const html = generateConfirmationEmailHTML({
      participantName,
      eventTitle,
      eventDate,
      eventVenue,
      participantEmail: to,
      registrationDetails,
    });

    const mailOptions: any = {
      from: env.GMAIL_FROM_NAME
        ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>`
        : env.GMAIL_USER,
      to,
      subject: `🎉 Registration Confirmed - ${eventTitle}`,
      html,
    };

    // Add attachment if provided
    if (attachmentBuffer && attachmentFilename) {
      mailOptions.attachments = [
        {
          filename: attachmentFilename,
          content: attachmentBuffer,
          contentType: "application/pdf",
        },
      ];
    }

    const info = await mailer.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send confirmation email with attachment:", error);
    throw error;
  }
};

// Send confirmation email function
export const sendConfirmationEmail = async ({
  to,
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  registrationDetails,
}: {
  to: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
}) => {
  try {
    const html = generateConfirmationEmailHTML({
      participantName,
      eventTitle,
      eventDate,
      eventVenue,
      participantEmail: to,
      registrationDetails,
    });

    const info = await mailer.sendMail({
      from: env.GMAIL_FROM_NAME
        ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>`
        : env.GMAIL_USER,
      to,
      subject: `🎉 Registration Confirmed - ${eventTitle}`,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    throw error;
  }
};

// Generic send email function with optional attachments
export const sendEmail = async ({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}) => {
  try {
    const mailOptions: any = {
      from: env.GMAIL_FROM_NAME
        ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>`
        : env.GMAIL_USER,
      to,
      subject,
      html,
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await mailer.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

// Generate payment confirmation email HTML template
const generatePaymentConfirmationEmailHTML = ({
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  participantEmail,
  invoiceNumber,
  paymentAmount,
  registrationDetails,
}: {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  participantEmail: string;
  invoiceNumber: string;
  paymentAmount: number;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
}) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #333333;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding: 50px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 48px 40px 36px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.4px;">💰 Payment Confirmed!</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">Your registration is now complete</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px 40px;">
              <p style="margin: 0 0 24px; font-size: 16px;">Dear <strong>${participantName}</strong>,</p>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #444444;">
                Great news! Your payment for <strong>${eventTitle}</strong> has been verified and confirmed by our team. 
                Your registration is now complete and you're officially enrolled for the event.
              </p>

              <!-- Payment Status -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #10b981; text-align: center;">
                <div style="font-size: 18px; font-weight: 600; color: #047857; margin-bottom: 8px;">✅ Payment Status: VERIFIED</div>
                <div style="font-size: 14px; color: #047857;">Amount Paid: ₹${paymentAmount}</div>
                <div style="font-size: 12px; color: #059669; margin-top: 5px;">Invoice #${invoiceNumber}</div>
              </div>

              <!-- Invoice Notice -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #f59e0b; text-align: center;">
                <p style="margin: 0; font-size: 16px; color: #92400e; font-weight: 600;">📄 Payment Invoice Attached</p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #92400e;">Your official payment invoice is attached to this email for tax and record purposes.</p>
              </div>

              <!-- Event Details -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #0ea5e9;">
                <h3 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #0c4a6e;">📅 Your Event Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Event:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Date:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Venue:</td>
                    <td style="padding: 8px 0; color: #111827;">${eventVenue}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Amount Paid:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">₹${paymentAmount}</td>
                  </tr>
                </table>
              </div>

              <!-- Next Steps -->
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid #64748b;">
                <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #475569;">🎯 What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Save the attached invoice for your records</li>
                  <li style="margin-bottom: 8px;">Mark your calendar for ${eventDate}</li>
                  <li style="margin-bottom: 8px;">Bring a valid government-issued photo ID</li>
                  <li style="margin-bottom: 8px;">Arrive at the venue 30 minutes before the event starts</li>
                  <li style="margin-bottom: 8px;">Check your email for any event updates</li>
                </ul>
              </div>

              <!-- Important Notice -->
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #ef4444;">
                <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #dc2626;">⚠️ Important Reminders</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">This invoice serves as your proof of payment</li>
                  <li style="margin-bottom: 8px;">Registration is non-transferable and non-refundable</li>
                  <li style="margin-bottom: 8px;">Keep this email and invoice accessible on your phone</li>
                  <li style="margin-bottom: 8px;">Contact support if you have any questions</li>
                </ul>
              </div>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #444444;">
                We're thrilled to have you join us for this amazing event! If you have any questions or need assistance, 
                please don't hesitate to reach out to our support team.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="mailto:${env.GMAIL_USER}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Contact Support</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">Need help? Contact us at 
                <a href="mailto:${env.GMAIL_USER}" style="color: #059669; text-decoration: none;">${env.GMAIL_USER}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">© 2025 ${env.GMAIL_FROM_NAME || "CodeBreakers 2025, GCEK"}. All rights reserved.</p>
            </td>
          </tr>
        </table>

        <!-- Disclaimer -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                This payment confirmation was sent automatically. Please keep this invoice for tax and accounting purposes.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Send payment confirmation email with invoice attachment
export const sendPaymentConfirmationEmail = async ({
  to,
  participantName,
  eventTitle,
  eventDate,
  eventVenue,
  invoiceNumber,
  paymentAmount,
  registrationDetails,
  invoiceBuffer,
  invoiceFilename,
}: {
  to: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  invoiceNumber: string;
  paymentAmount: number;
  registrationDetails: {
    fullName: string;
    mobileNumber: string;
    whatsappNumber?: string;
    collegeName: string;
    state: string;
    district: string;
  };
  invoiceBuffer: Buffer;
  invoiceFilename: string;
}) => {
  try {
    const html = generatePaymentConfirmationEmailHTML({
      participantName,
      eventTitle,
      eventDate,
      eventVenue,
      participantEmail: to,
      invoiceNumber,
      paymentAmount,
      registrationDetails,
    });

    const mailOptions = {
      from: env.GMAIL_FROM_NAME
        ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>`
        : env.GMAIL_USER,
      to,
      subject: `💰 Payment Confirmed - ${eventTitle} | Invoice #${invoiceNumber}`,
      html,
      attachments: [
        {
          filename: invoiceFilename,
          content: invoiceBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const info = await mailer.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send payment confirmation email:", error);
    throw error;
  }
};

// Generate Welcome Email HTML Template
export const generateWelcomeEmailHTML = ({
  firstName = "there",
  companyName = "CodeBreakers",
  getStartedUrl = "https://app.codebreakersgcek.tech/login",
  supportEmail = "cse.codebreaker@gcekbpatna.ac.in",
  companyAddress = "GCEK, Bhawanipatna, Odisha",
}: {
  firstName?: string;
  companyName?: string;
  getStartedUrl?: string;
  supportEmail?: string;
  companyAddress?: string;
}) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
<head>
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <title>Welcome to ${companyName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
    }
    @media only screen and (max-width: 620px) {
      .email-card {
        padding: 28px 20px !important;
      }
      .email-wrapper {
        padding: 16px 8px !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table class="email-wrapper" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table class="email-card" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:40px 36px;box-sizing:border-box;text-align:left;">
          <tr>
            <td>
              <h1 style="margin:0 0 18px 0;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3;letter-spacing:-0.02em;">
                Welcome to ${companyName}, ${firstName}👋
              </h1>

              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
                We're thrilled to have you on board. Your account is ready, and you can now access all the tools and features designed to help you get more done.
              </p>

              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#334155;">
                To help you get started quickly, here are a few things you can do right away:
              </p>

              <ul style="margin:0 0 28px 0;padding-left:22px;font-size:15px;line-height:1.75;color:#334155;">
                <li style="margin-bottom:6px;">
                  <strong style="color:#0f172a;">Complete your profile</strong> so we can personalize your experience.
                </li>
                <li style="margin-bottom:6px;">
                  <strong style="color:#0f172a;">Explore the dashboard</strong> to see everything available to you.
                </li>
                <li style="margin-bottom:6px;">
                  <strong style="color:#0f172a;">Invite your team</strong> to collaborate on projects together.
                </li>
              </ul>

              <div style="text-align:center;margin:32px 0;">
                <a href="${getStartedUrl}" style="display:inline-block;background-color:#000000;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 32px;border-radius:6px;letter-spacing:0.01em;" target="_blank">
                  Get started
                </a>
              </div>

              <p style="margin:28px 0 16px 0;font-size:14px;line-height:1.6;color:#475569;">
                If you have any questions or need a hand, our support team is always ready to help. Just reply to this email or reach out to us at <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:underline;">${supportEmail}</a>.
              </p>

              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#475569;">
                Welcome aboard,<br />
                <strong style="color:#0f172a;">The ${companyName} Team</strong>
              </p>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px 0;" />

              <div style="text-align:center;font-size:12px;color:#94a3b8;line-height:1.6;">
                ${companyName} &bull; ${companyAddress}<br />
                &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Generate Form Submission Confirmation Email HTML Template
export const generateFormSubmissionEmailHTML = ({
  firstName = "there",
  formName = "Form",
  responseId = "",
  submittedAt = "",
  companyName = "CodeBreakers",
}: {
  firstName?: string;
  formName?: string;
  responseId?: string;
  submittedAt?: string;
  companyName?: string;
}) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" lang="en"><head><meta content="width=device-width" name="viewport"/><meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/><meta name="x-apple-disable-message-reformatting"/><meta content="IE=edge" http-equiv="X-UA-Compatible"/><meta name="x-apple-disable-message-reformatting"/><meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection"/><title>Your submission has been received and is under review.</title><style>@media (prefers-color-scheme: dark){li::marker{color:#c4c4c4}}</style></head><body dir="ltr" lang="en"><!--$--><!--html--><!--head--><div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">Your submission has been received and is under review.<div>                                                                                                                                                  </div></div><!--body--><table border="0" width="100%" cellPadding="0" cellSpacing="0" role="presentation" align="center"><tbody><tr><td dir="ltr" lang="en" style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:1em;min-height:100%;line-height:155%;text-decoration:none"><table align="left" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:600px;align:left;width:100%;border-radius:0px;line-height:155%"><tbody><tr style="width:100%"><td style="padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px"><h2 style="margin:0;padding:0;font-size:1.8em;line-height:1.44em;padding-top:0.389em;font-weight:600">We received your submission</h2><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Hi ${firstName},</p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Thanks for submitting the ${formName}. We've received your response.</p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">For your records, here is your response confirmation ID:</p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><strong>Response ID: </strong>${responseId}</p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Submitted on: ${submittedAt}</p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Please keep this ID handy in case you need to reference your submission in future correspondence. If you have any questions, simply reply to this email and we'll be glad to help.</p><p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Best regards,<br/>The ${companyName} Team</p></td></tr></tbody></table></td></tr></tbody></table><!--/$--></body></html>`;
};

// Send Welcome Email
export const sendWelcomeEmail = async ({
  to,
  firstName,
  getStartedUrl,
  supportEmail,
  companyAddress,
}: {
  to: string;
  firstName?: string;
  getStartedUrl?: string;
  supportEmail?: string;
  companyAddress?: string;
}) => {
  try {
    const html = generateWelcomeEmailHTML({
      firstName,
      companyName: "CodeBreakers",
      getStartedUrl,
      supportEmail,
      companyAddress,
    });

    const info = await mailer.sendMail({
      from: env.GMAIL_FROM_NAME
        ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>`
        : env.GMAIL_USER,
      to,
      subject: "Welcome to CodeBreakers 👋",
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }
};

// Send Form Submission Email
export const sendFormSubmissionEmail = async ({
  to,
  firstName,
  formName,
  responseId,
  submittedAt,
}: {
  to: string;
  firstName?: string;
  formName?: string;
  responseId?: string;
  submittedAt?: string;
}) => {
  try {
    const html = generateFormSubmissionEmailHTML({
      firstName,
      formName,
      responseId,
      submittedAt,
      companyName: "CodeBreakers",
    });

    const info = await mailer.sendMail({
      from: env.GMAIL_FROM_NAME
        ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>`
        : env.GMAIL_USER,
      to,
      subject: `Submission Received: ${formName || "Form"}`,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send form submission email:", error);
    return { success: false, error };
  }
};

// Generate Invoice Design HTML Template based on invoice-design.md
export const generateInvoiceDesignHTML = ({
  recipientName = "Participant",
  recipientEmail = "",
  formTitle = "Form",
  referenceNumber = "CB-INV-001",
  issuedDate = new Date().toLocaleDateString("en-US"),
  transactionId = "",
  paymentAmount = 0,
  collegeName = "",
}: {
  recipientName?: string;
  recipientEmail?: string;
  formTitle?: string;
  referenceNumber?: string;
  issuedDate?: string;
  transactionId?: string;
  paymentAmount?: number;
  collegeName?: string;
}) => {
  const formattedAmount = (paymentAmount || 0).toFixed(2);
  const logoUrl =
    "https://res.cloudinary.com/dw47ib0sh/image/upload/v1764077429/mydzalimrmzbscn0bmue.png";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice - CodeBreakers</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color: #0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Message Card -->
        <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; overflow: hidden; padding: 28px; margin-bottom: 20px; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; color: #1c1917; line-height: 1.6;">
          <tr>
            <td>
              <h2 style="font-size: 20px; font-weight: 700; color: #0c0a09; margin: 0 0 12px 0;">🎉 Registration Approved & Payment Verified</h2>
              <p style="margin: 0 0 12px 0;">Hi <strong>${recipientName}</strong>,</p>
              <p style="margin: 0 0 12px 0;">Great news! Your response and payment for <strong>${formTitle}</strong> have been successfully verified and approved by the CodeBreakers team.</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fafaf9; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
                <tr>
                  <td>
                    <p style="margin: 0;"><strong>Reference ID:</strong> ${referenceNumber}</p>
                    ${transactionId ? `<p style="margin: 4px 0 0 0;"><strong>Transaction ID:</strong> ${transactionId}</p>` : ""}
                    <p style="margin: 4px 0 0 0;"><strong>Amount Paid:</strong> ₹${formattedAmount}</p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0;">Below is your verified payment receipt for your records.</p>
              <p style="margin: 0; color: #78716c; font-size: 13px;">Best regards,<br/><strong>The CodeBreakers Team</strong></p>
            </td>
          </tr>
        </table>

        <!-- Main Invoice Container -->
        <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; overflow: hidden; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Header Row with Logo and INVOICE Title -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="left" valign="top">
                    <img src="${logoUrl}" alt="CodeBreakers Logo" style="width: 48px; height: 48px; display: block; border-radius: 8px;" />
                  </td>
                  <td align="right" valign="top">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #0c0a09;">INVOICE</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Meta Row: Reference & Dates -->
          <tr>
            <td style="padding-top: 32px; padding-bottom: 24px; border-bottom: 1px solid #e7e5e4;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size: 13px; line-height: 1.6; color: #44403c;">
                <tr>
                  <td width="50%" valign="top">
                    <p style="margin: 0;"><strong>Reference:</strong> ${referenceNumber}</p>
                    <p style="margin: 0;"><strong>Issued:</strong> ${issuedDate}</p>
                    <p style="margin: 0;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: 700;">PAID & APPROVED</span></p>
                  </td>
                  <td width="50%" valign="top" align="right">
                    <p style="margin: 0;"><strong>Payment Method:</strong> UPI</p>
                    <p style="margin: 0;"><strong>Transaction ID:</strong> ${transactionId || "N/A"}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- From and Bill To Row -->
          <tr>
            <td style="padding-top: 24px; padding-bottom: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size: 13px; line-height: 1.6; color: #44403c;">
                <tr>
                  <td width="50%" valign="top">
                    <p style="margin: 0 0 8px 0; font-weight: 700; text-transform: uppercase; color: #0c0a09; letter-spacing: 0.05em;">FROM</p>
                    <p style="margin: 0; font-weight: 600; color: #0c0a09;">CodeBreakers</p>
                    <p style="margin: 0;">Government College of Engineering Kalahandi</p>
                    <p style="margin: 0;">Bhawanipatna, Odisha 766002</p>
                    <p style="margin: 0;">Tax ID: CB-1029384756</p>
                  </td>
                  <td width="50%" valign="top" align="right">
                    <p style="margin: 0 0 8px 0; font-weight: 700; text-transform: uppercase; color: #0c0a09; letter-spacing: 0.05em;">BILL TO</p>
                    <p style="margin: 0; font-weight: 600; color: #0c0a09;">${recipientName}</p>
                    <p style="margin: 0;">${recipientEmail}</p>
                    ${collegeName ? `<p style="margin: 0;">${collegeName}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background-color: #e7e5e4;">
                    <th align="left" style="padding: 10px 12px; font-weight: 700; text-transform: uppercase; color: #0c0a09;">Description</th>
                    <th align="right" style="padding: 10px 12px; font-weight: 700; text-transform: uppercase; color: #0c0a09;">Units</th>
                    <th align="right" style="padding: 10px 12px; font-weight: 700; text-transform: uppercase; color: #0c0a09;">Unit Cost</th>
                    <th align="right" style="padding: 10px 12px; font-weight: 700; text-transform: uppercase; color: #0c0a09;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid #e7e5e4;">
                    <td style="padding: 12px; color: #0c0a09;">${formTitle}</td>
                    <td align="right" style="padding: 12px; color: #44403c;">1</td>
                    <td align="right" style="padding: 12px; color: #44403c;">₹${formattedAmount}</td>
                    <td align="right" style="padding: 12px; font-weight: 600; color: #0c0a09;">₹${formattedAmount}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Summary & Balance Due -->
          <tr>
            <td style="padding-top: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td width="40%"></td>
                  <td width="60%">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size: 13px; line-height: 1.8; color: #44403c;">
                      <tr>
                        <td>Net Amount:</td>
                        <td align="right">₹${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td>Discount:</td>
                        <td align="right">₹0.00</td>
                      </tr>
                      <tr style="border-top: 2px solid #0c0a09; border-bottom: 2px solid #0c0a09; font-weight: 700; color: #0c0a09;">
                        <td style="padding: 8px 0; text-transform: uppercase;">Total Amount Paid:</td>
                        <td align="right" style="padding: 8px 0; font-size: 15px;">₹${formattedAmount} (PAID)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 48px; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; margin-top: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="left" valign="top">
                    <p style="margin: 0;">cse.codebreaker@gcekbpatna.ac.in</p>
                    <p style="margin: 0;">CodeBreakers • GCEK Bhawanipatna</p>
                  </td>
                  <td align="right" valign="top">
                    <p style="margin: 0;">Issued by CodeBreakers Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Send Form Response Invoice Email
export const sendFormResponseInvoiceEmail = async ({
  to,
  recipientName = "Participant",
  formTitle = "Form",
  referenceNumber = "CB-INV-001",
  issuedDate = new Date().toLocaleDateString("en-US"),
  transactionId = "",
  paymentAmount = 0,
  collegeName = "",
}: {
  to: string;
  recipientName?: string;
  formTitle?: string;
  referenceNumber?: string;
  issuedDate?: string;
  transactionId?: string;
  paymentAmount?: number;
  collegeName?: string;
}) => {
  try {
    const html = generateInvoiceDesignHTML({
      recipientName,
      recipientEmail: to,
      formTitle,
      referenceNumber,
      issuedDate,
      transactionId,
      paymentAmount,
      collegeName,
    });

    const mailOptions = {
      from: env.GMAIL_FROM_NAME
        ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>`
        : env.GMAIL_USER,
      to,
      subject: `🎉 Registration Approved & Official Receipt - ${formTitle} | ${referenceNumber}`,
      html,
    };

    const info = await mailer.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send form response invoice email:", error);
    return { success: false, error };
  }
};

// Generate Quiz Result Email HTML
const generateQuizResultHTML = ({
  recipientName,
  quizTitle,
  score,
  totalQuestions,
  correctAnswers,
  pointsEarned,
  isPassed,
  statusLabel,
  answersBreakdown,
}: {
  recipientName: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  pointsEarned: number;
  isPassed?: boolean;
  statusLabel?: string;
  answersBreakdown: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}) => {
  const percentage = score;
  const passed = isPassed !== undefined ? isPassed : percentage >= 50;
  const label =
    statusLabel || (passed ? "QUALIFIED / PASSED" : "FAILED / NOT QUALIFIED");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quiz Result - ${quizTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:'Inter',Arial,sans-serif;color:#262523;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#FFFFFF;">
    <tr>
      <td align="center" style="padding:0;">
        <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #E3DFD6;">

          <!-- Letterhead -->
          <tr>
            <td style="padding:28px 40px 20px 40px;border-bottom:2px solid #262523;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td valign="middle">
                    <img src="https://res.cloudinary.com/dw47ib0sh/image/upload/v1764077429/mydzalimrmzbscn0bmue.png" alt="CodeBreakers" style="max-width:110px;height:auto;display:block;" />
                  </td>
                  <td valign="middle" align="right">
                    <div style="font-size:10px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#867F73;">Government College of Engineering Kalahandi</div>
                    <div style="font-size:10px;color:#A9A296;margin-top:2px;">CodeBreakers Assessment Cell</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Document title -->
          <tr>
            <td style="padding:24px 40px 4px 40px;">
              <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#867F73;">Result Statement</div>
              <div style="font-size:20px;font-weight:700;color:#262523;margin-top:4px;">${quizTitle}</div>
            </td>
          </tr>

          <!-- Candidate info -->
          <tr>
            <td style="padding:16px 40px 24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #E3DFD6;border-bottom:1px solid #E3DFD6;">
                <tr>
                  <td style="padding:10px 0;font-size:11px;color:#867F73;width:35%;">Candidate Name</td>
                  <td style="padding:10px 0;font-size:12px;font-weight:600;color:#262523;">${recipientName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:11px;color:#867F73;border-top:1px solid #F0EEE9;">Assessment</td>
                  <td style="padding:10px 0;font-size:12px;font-weight:600;color:#262523;border-top:1px solid #F0EEE9;">${quizTitle}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:11px;color:#867F73;border-top:1px solid #F0EEE9;">Result Status</td>
                  <td style="padding:10px 0;font-size:12px;font-weight:700;color:${passed ? "#256D45" : "#B23A2F"};border-top:1px solid #F0EEE9;">${label}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Score table -->
          <tr>
            <td style="padding:0 40px 8px 40px;">
              <div style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#867F73;margin-bottom:10px;">Score Summary</div>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #E3DFD6;">
                <tr style="background:#FAF9F6;">
                  <td style="padding:9px 14px;font-size:10px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:#4A4742;border-right:1px solid #E3DFD6;">Metric</td>
                  <td align="right" style="padding:9px 14px;font-size:10px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:#4A4742;">Value</td>
                </tr>
                <tr>
                  <td style="padding:11px 14px;font-size:12px;color:#4A4742;border-top:1px solid #E3DFD6;border-right:1px solid #E3DFD6;">Total Questions</td>
                  <td align="right" style="padding:11px 14px;font-size:12px;font-weight:600;color:#262523;border-top:1px solid #E3DFD6;">${totalQuestions}</td>
                </tr>
                <tr>
                  <td style="padding:11px 14px;font-size:12px;color:#4A4742;border-top:1px solid #E3DFD6;border-right:1px solid #E3DFD6;">Correct Answers</td>
                  <td align="right" style="padding:11px 14px;font-size:12px;font-weight:600;color:#262523;border-top:1px solid #E3DFD6;">${correctAnswers}</td>
                </tr>
                <tr>
                  <td style="padding:11px 14px;font-size:12px;color:#4A4742;border-top:1px solid #E3DFD6;border-right:1px solid #E3DFD6;">Points Earned</td>
                  <td align="right" style="padding:11px 14px;font-size:12px;font-weight:600;color:#262523;border-top:1px solid #E3DFD6;">${pointsEarned}</td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;font-size:12px;font-weight:700;color:#262523;border-top:1px solid #262523;border-right:1px solid #E3DFD6;">Final Percentage</td>
                  <td align="right" style="padding:12px 14px;font-size:14px;font-weight:800;color:${passed ? "#256D45" : "#B23A2F"};border-top:1px solid #262523;">${percentage.toFixed(1)}%</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td style="padding:24px 40px 8px 40px;">
              <p style="margin:0;font-size:11px;color:#867F73;line-height:1.6;">
                This statement is generated automatically by the CodeBreakers Admin Portal and does not require a signature. For discrepancies, please contact the assessment cell within 7 days of receipt.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #E3DFD6;">
              <span style="font-size:10px;color:#A9A296;">&copy; 2026 CodeBreakers &middot; Government College of Engineering Kalahandi</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Send Quiz Result Email Function
export const sendQuizResultEmail = async ({
  to,
  recipientName = "Participant",
  quizTitle = "Quiz",
  score = 0,
  totalQuestions = 0,
  correctAnswers = 0,
  pointsEarned = 0,
  isPassed,
  statusLabel,
  answersBreakdown = [],
}: {
  to: string;
  recipientName?: string;
  quizTitle?: string;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  pointsEarned?: number;
  isPassed?: boolean;
  statusLabel?: string;
  answersBreakdown?: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}) => {
  try {
    const html = generateQuizResultHTML({
      recipientName,
      quizTitle,
      score,
      totalQuestions,
      correctAnswers,
      pointsEarned,
      isPassed,
      statusLabel,
      answersBreakdown,
    });

    const passed = isPassed !== undefined ? isPassed : score >= 50;
    const mailOptions = {
      from: env.GMAIL_FROM_NAME
        ? `${env.GMAIL_FROM_NAME} <${env.GMAIL_USER}>`
        : env.GMAIL_USER,
      to,
      subject: `${passed ? "🏆" : "📋"} Your Quiz Results - ${quizTitle} (${score.toFixed(1)}%)`,
      html,
    };

    const info = await mailer.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send quiz result email:", error);
    return { success: false, error };
  }
};
