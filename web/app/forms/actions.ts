/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { cache } from "react";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { FormDefinition } from "@/lib/form-types";
import { sendFormSubmissionEmail } from "@/lib/mailer";

export interface PublishedFormResponse {
  id: string;
  formId: string;
  title: string;
  description: string | null;
  definition: FormDefinition;
  isPublished: boolean;
  acceptingResponses: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function hasPaymentField(definition: FormDefinition) {
  return definition.sections.some((section) =>
    section.fields.some((field) => field.type === "payment")
  );
}

export const getPublishedFormByFormId = cache(async (formId: string) => {
  try {
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ formId }, { id: formId }],
      },
      select: {
        id: true,
        formId: true,
        title: true,
        description: true,
        definition: true,
        isPublished: true,
        acceptingResponses: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!form) {
      return { status: "error" as const, message: "Form not found" };
    }

    return {
      status: "success" as const,
      data: {
        ...form,
        definition: form.definition as unknown as FormDefinition,
      } as PublishedFormResponse,
    };
  } catch (error) {
    console.error("Error fetching published form:", error);
    return { status: "error" as const, message: "Failed to fetch form" };
  }
});

function extractEmailFromAnswers(answers: Record<string, unknown>): string | null {
  if (typeof answers.email === "string" && answers.email.trim()) {
    return answers.email.trim().toLowerCase();
  }
  for (const [k, v] of Object.entries(answers)) {
    if (typeof v === "string") {
      const val = v.trim().toLowerCase();
      if (val.includes("@") && val.includes(".") && (k.toLowerCase().includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))) {
        return val;
      }
    } else if (Array.isArray(v)) {
      for (const item of v) {
        if (item && typeof item === "object") {
          for (const [subK, subV] of Object.entries(item)) {
            if (typeof subV === "string") {
              const val = subV.trim().toLowerCase();
              if (val.includes("@") && val.includes(".") && (subK.toLowerCase().includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))) {
                return val;
              }
            }
          }
        }
      }
    }
  }
  return null;
}

export async function submitFormResponse(input: {
  formId: string;
  answers: Record<string, unknown>;
  transactionId?: string | null;
}) {
  try {
    const form = await prisma.form.findFirst({
      where: {
        OR: [{ formId: input.formId }, { id: input.formId }],
      },
      select: {
        id: true,
        formId: true,
        title: true,
        definition: true,
        isPublished: true,
        acceptingResponses: true,
        googleDriveFolderId: true,
      },
    });

    if (!form || !form.isPublished) {
      return { status: "error" as const, message: "Form not found or not published" };
    }

    if (!form.acceptingResponses) {
      return { status: "error" as const, message: "This form is no longer accepting responses" };
    }

    const formDef = form.definition as unknown as FormDefinition;
    const allowMultiple = Boolean(formDef.settings?.allowMultipleSubmissions);

    if (hasPaymentField(formDef) && !input.transactionId?.trim()) {
      return {
        status: "error" as const,
        message: "Transaction ID is required for payment forms",
      };
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const submitterEmail =
      extractEmailFromAnswers(input.answers) ||
      (formDef.settings?.collectEmail ? session?.user?.email?.toLowerCase() : null) ||
      null;
    const submitterUserId = session?.user?.id || null;

    let duplicateFound: {
      id: string;
      createdAt: Date;
      paymentStatus: string;
      transactionId?: string | null;
    } | null = null;

    // 1. Check duplicate Transaction ID ONLY for actual UTR/Reference numbers (ignore generic words like Cash, NA, None)
    const rawTxId = input.transactionId?.trim() || "";
    const cleanedTxId = rawTxId.toLowerCase();
    const GENERIC_TX = new Set([
      "cash", "by cash", "in cash", "cash payment",
      "na", "n/a", "none", "nil", "null", "no", "not applicable",
      "offline", "offline payment", "hand", "hand to hand",
      "paid", "already paid", "done", "pending", "free", "test",
      "gpay", "phonepe", "paytm", "upi", "google pay", "0", "000000"
    ]);

    const isActualTxReference =
      rawTxId.length >= 6 &&
      !GENERIC_TX.has(cleanedTxId) &&
      !/^(cash|offline|paid|none|nil|na|upi|gpay|phonepe)/i.test(cleanedTxId);

    if (isActualTxReference) {
      const existingTx = await prisma.formResponse.findFirst({
        where: {
          formId: { in: [form.id, form.formId] },
          transactionId: {
            equals: rawTxId,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          createdAt: true,
          paymentStatus: true,
          transactionId: true,
        },
      });
      if (existingTx) {
        duplicateFound = existingTx;
      }
    }

    // 2. If multiple submissions are NOT allowed for this form, check email duplicate within this specific form
    if (!duplicateFound && !allowMultiple) {
      if (submitterEmail) {
        const existingResponses = await prisma.formResponse.findMany({
          where: {
            formId: { in: [form.id, form.formId] },
          },
          select: {
            id: true,
            answers: true,
            submittedById: true,
            createdAt: true,
            paymentStatus: true,
          },
          orderBy: { createdAt: "desc" },
        });

        for (const prev of existingResponses) {
          const prevAnswers = (prev.answers || {}) as Record<string, unknown>;
          const prevEmail = extractEmailFromAnswers(prevAnswers);
          if (prevEmail && prevEmail.toLowerCase() === submitterEmail.toLowerCase()) {
            duplicateFound = prev;
            break;
          }
          if (submitterUserId && prev.submittedById === submitterUserId) {
            duplicateFound = prev;
            break;
          }
        }
      } else if (submitterUserId) {
        const existingUserResp = await prisma.formResponse.findFirst({
          where: {
            formId: { in: [form.id, form.formId] },
            submittedById: submitterUserId,
          },
          select: {
            id: true,
            createdAt: true,
            paymentStatus: true,
          },
        });
        if (existingUserResp) {
          duplicateFound = existingUserResp;
        }
      }
    }

    if (duplicateFound) {
      const shortRef = `CB-INV-${duplicateFound.id.slice(0, 8).toUpperCase()}`;
      return {
        status: "duplicate" as const,
        isDuplicate: true,
        previousResponseId: duplicateFound.id,
        referenceNumber: shortRef,
        message: `You have already submitted a response for "${form.title || "this form"}". Duplicate submissions are not allowed.`,
        data: {
          id: duplicateFound.id,
          referenceNumber: shortRef,
          submittedAt: duplicateFound.createdAt.toISOString(),
          paymentStatus: duplicateFound.paymentStatus,
        },
      };
    }

    // Generate Response IDs
    const responseRecordId = randomUUID();
    const shortResponseId = responseRecordId.replace(/-/g, "").slice(0, 8).toUpperCase();

    // ─── Process & Upload Form Files to Google Drive ───
    const cleanedAnswers = { ...input.answers };
    const uploadedFilesToCreate: Array<{
      fieldId: string;
      originalFileName: string;
      storedFileName: string;
      mimeType: string;
      fileSize: number;
      googleDriveFileId: string;
      googleDriveFolderId: string;
      googleDriveWebViewLink?: string;
      googleDriveDownloadLink?: string;
    }> = [];

    // Check if any answers contain file uploads with base64 data
    const hasFiles = Object.values(input.answers).some((val) =>
      Array.isArray(val) && val.some((item) => item && typeof item === "object" && "base64Data" in item)
    );

    if (hasFiles) {
      const { GoogleDriveService } = await import("@/lib/google-drive-service");
      let accessToken = "";
      let connectionId = "";

      try {
        const tokenRes = await GoogleDriveService.getValidAccessToken();
        accessToken = tokenRes.accessToken;
        connectionId = tokenRes.connectionId;
      } catch (err: any) {
        console.error("Google Drive connection error during submit:", err);
        return {
          status: "error" as const,
          message: "Google Drive is not connected. File uploads for this form are temporarily unavailable.",
        };
      }

      // Get or create parent Forms folder
      const rootFolderId = await GoogleDriveService.getOrCreateFormsFolder(accessToken, connectionId);

      // Get or create form-specific folder CB-FRM-{FORM_ID}
      const formFolderId = await GoogleDriveService.getOrCreateFormFolder({
        formId: form.formId,
        accessToken,
        rootFolderId,
      });

      // Track extension counts for collision-safe naming: 830981B9.jpg, 830981B9-2.jpg, etc.
      const extensionCountMap: Record<string, number> = {};
      const allFilesList: Array<{ fieldId: string; fileObj: any; ext: string }> = [];

      for (const [fieldId, val] of Object.entries(input.answers)) {
        if (Array.isArray(val)) {
          for (const item of val) {
            if (item && typeof item === "object" && "base64Data" in item) {
              const fileName = item.compressedName || item.originalName || "file";
              const dotIdx = fileName.lastIndexOf(".");
              const ext = dotIdx !== -1 ? fileName.slice(dotIdx + 1).toLowerCase() : "bin";
              extensionCountMap[ext] = (extensionCountMap[ext] || 0) + 1;
              allFilesList.push({ fieldId, fileObj: item, ext });
            }
          }
        }
      }

      const extensionIndexMap: Record<string, number> = {};

      for (const { fieldId, fileObj, ext } of allFilesList) {
        extensionIndexMap[ext] = (extensionIndexMap[ext] || 0) + 1;
        const totalWithExt = extensionCountMap[ext] || 1;
        const storedFileName =
          totalWithExt > 1
            ? `${shortResponseId}-${extensionIndexMap[ext]}.${ext}`
            : `${shortResponseId}.${ext}`;

        const base64Clean = fileObj.base64Data.replace(/^data:[^;]+;base64,/, "");
        const fileBuffer = Buffer.from(base64Clean, "base64");

        // Validate buffer size strictly <= 300 KB
        const MAX_BYTES = 300 * 1024;
        if (fileBuffer.byteLength > MAX_BYTES) {
          return {
            status: "error" as const,
            message: `File "${fileObj.originalName}" exceeds the maximum compressed limit of 300 KB (${(
              fileBuffer.byteLength / 1024
            ).toFixed(1)} KB). Please choose a smaller file.`,
          };
        }

        const driveResult = await GoogleDriveService.uploadFile({
          formFolderId,
          fileName: storedFileName,
          mimeType: fileObj.mimeType || "application/octet-stream",
          buffer: fileBuffer,
          accessToken,
        });

        uploadedFilesToCreate.push({
          fieldId,
          originalFileName: fileObj.originalName,
          storedFileName,
          mimeType: fileObj.mimeType || driveResult.mimeType,
          fileSize: driveResult.size,
          googleDriveFileId: driveResult.id,
          googleDriveFolderId: formFolderId,
          googleDriveWebViewLink: driveResult.webViewLink,
          googleDriveDownloadLink: driveResult.webContentLink,
        });
      }

      // Replace base64 data in cleanedAnswers with clean metadata
      for (const [fieldId, val] of Object.entries(cleanedAnswers)) {
        if (Array.isArray(val)) {
          const fieldUploads = uploadedFilesToCreate.filter((f) => f.fieldId === fieldId);
          if (fieldUploads.length > 0) {
            cleanedAnswers[fieldId] = fieldUploads.map((f) => ({
              storedFileName: f.storedFileName,
              originalFileName: f.originalFileName,
              mimeType: f.mimeType,
              fileSize: f.fileSize,
              googleDriveFileId: f.googleDriveFileId,
              webViewLink: f.googleDriveWebViewLink,
              downloadLink: f.googleDriveDownloadLink,
            }));
          }
        }
      }
    }

    const response = await prisma.formResponse.create({
      data: {
        id: responseRecordId,
        formId: form.id,
        answers: cleanedAnswers as unknown as import("@prisma/client").Prisma.InputJsonValue,
        transactionId: input.transactionId?.trim() || null,
        paymentStatus: hasPaymentField(formDef)
          ? (input.transactionId?.trim()?.startsWith("pay_") ? "verified" : "pending")
          : "submitted",
        verifiedAt: hasPaymentField(formDef) && input.transactionId?.trim()?.startsWith("pay_") ? new Date() : null,
        submittedById: session?.user?.id || null,
        files: {
          create: uploadedFilesToCreate.map((f) => ({
            formId: form.id,
            fieldId: f.fieldId,
            originalFileName: f.originalFileName,
            storedFileName: f.storedFileName,
            mimeType: f.mimeType,
            fileSize: f.fileSize,
            googleDriveFileId: f.googleDriveFileId,
            googleDriveFolderId: f.googleDriveFolderId,
            googleDriveWebViewLink: f.googleDriveWebViewLink,
            googleDriveDownloadLink: f.googleDriveDownloadLink,
          })),
        },
      },
    });

    const { emitSocketEvent } = await import("@/lib/socket-server");
    const { revalidatePath } = await import("next/cache");

    emitSocketEvent(`form-${form.id}`, "response-submitted", { responseId: response.id, formId: form.id });
    emitSocketEvent(`form-${form.formId}`, "response-submitted", { responseId: response.id, formId: form.formId });

    revalidatePath(`/admin/forms/${form.id}/responses`);
    revalidatePath(`/admin/forms/${form.formId}/responses`);
    revalidatePath(`/admin/forms`);
    revalidatePath(`/co-admin/forms/${form.id}/responses`);
    revalidatePath(`/co-admin/forms/${form.formId}/responses`);
    revalidatePath(`/co-admin/forms`);

    // Trigger submission confirmation email asynchronously if recipient email is present
    let recipientEmail = "";
    let recipientName = "";

    const ansRecord = (cleanedAnswers || {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(ansRecord)) {
      if (typeof v === "string") {
        const valStr = v.trim();
        const keyLower = k.toLowerCase();
        if (!recipientEmail && (keyLower.includes("email") || (valStr.includes("@") && valStr.includes(".")))) {
          recipientEmail = valStr;
        }
        if (!recipientName && keyLower.includes("name") && valStr) {
          recipientName = valStr;
        }
      } else if (Array.isArray(v)) {
        for (const item of v) {
          if (item && typeof item === "object") {
            for (const [subK, subV] of Object.entries(item)) {
              if (typeof subV === "string") {
                const subStr = subV.trim();
                const subKLower = subK.toLowerCase();
                if (!recipientEmail && (subKLower.includes("email") || (subStr.includes("@") && subStr.includes(".")))) {
                  recipientEmail = subStr;
                }
                if (!recipientName && (subKLower.includes("name") || subKLower.includes("leader")) && subStr) {
                  recipientName = subStr;
                }
              }
            }
          }
        }
      }
    }

    if (recipientEmail) {
      const firstName = recipientName ? recipientName.split(" ")[0] : "there";
      const responseIdStr = `#${response.id.slice(0, 8).toUpperCase()}`;
      const submittedAtStr = new Date().toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      sendFormSubmissionEmail({
        to: recipientEmail,
        firstName,
        formName: form.title || "Form",
        responseId: responseIdStr,
        submittedAt: submittedAtStr,
      }).catch((err) => console.error("Error sending form submission email:", err));
    }

    return {
      status: "success" as const,
      message: "Response submitted successfully",
      data: response,
    };
  } catch (error: any) {
    console.error("Error submitting form response:", error);
    return { status: "error" as const, message: error.message || "Failed to submit response" };
  }
}
