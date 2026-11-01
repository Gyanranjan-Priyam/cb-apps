"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { requireCoAdmin } from "@/app/data/admin/require-co-admin";
import type { FormDefinition } from "@/lib/form-types";
import { sendFormResponseInvoiceEmail } from "@/lib/mailer";

export interface FormSummary {
  id: string;
  formId: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  acceptingResponses: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    responses: number;
  };
}

export interface FormFileSummary {
  id: string;
  fieldId: string;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  googleDriveFileId: string;
  googleDriveFolderId: string;
  googleDriveWebViewLink: string | null;
  googleDriveDownloadLink: string | null;
  createdAt: Date;
}

export interface FormResponseSummary {
  id: string;
  answers: unknown;
  transactionId: string | null;
  paymentStatus: string;
  verifiedAt: Date | null;
  createdAt: Date;
  submittedById: string | null;
  files?: FormFileSummary[];
}

export interface FormDetail {
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
  _count: {
    responses: number;
  };
  responses: FormResponseSummary[];
}

function generateFormId() {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `CB-FRM-${randomPart}`;
}

function normalizeDefinition(definition: FormDefinition): FormDefinition {
  return {
    ...definition,
    theme: definition.theme || "default",
    bannerKey: definition.bannerKey ?? "",
    bannerTemplate: definition.bannerTemplate ?? "purple-blue",
    sections: (definition.sections || [])
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((section, sectionIndex) => ({
        ...section,
        order: sectionIndex,
        fields: (section.fields || [])
          .slice()
          .sort((left, right) => left.order - right.order)
          .map((field, fieldIndex) => ({
            ...field,
            order: fieldIndex,
            required: Boolean(field.required),
            options: field.options ?? [],
          })),
      })),
    settings: {
      submitButtonLabel: definition.settings?.submitButtonLabel || "Submit",
      successMessage: definition.settings?.successMessage || "Your response has been submitted successfully.",
      allowMultipleSubmissions: Boolean(definition.settings?.allowMultipleSubmissions),
      collectName: definition.settings?.collectName !== false,
      collectEmail: definition.settings?.collectEmail !== false,
    },
  };
}

function toJsonValue(definition: FormDefinition): Prisma.InputJsonValue {
  return normalizeDefinition(definition) as unknown as Prisma.InputJsonValue;
}

async function ensureUniqueFormId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const formId = generateFormId();
    const existing = await prisma.form.findUnique({
      where: { formId },
      select: { id: true },
    });

    if (!existing) {
      return formId;
    }
  }

  throw new Error("Unable to generate a unique form ID");
}

export async function getAllForms() {
  await requireCoAdmin();

  try {
    const forms = await prisma.form.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        formId: true,
        title: true,
        description: true,
        isPublished: true,
        acceptingResponses: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { responses: true },
        },
      },
    });

    return { status: "success" as const, data: forms };
  } catch (error) {
    console.error("Error fetching forms:", error);
    return { status: "error" as const, message: "Failed to fetch forms" };
  }
}

export async function getFormByFormId(formId: string) {
  await requireCoAdmin();

  try {
    const form = await prisma.form.findUnique({
      where: { formId },
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
        _count: {
          select: { responses: true },
        },
        responses: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            answers: true,
            transactionId: true,
            paymentStatus: true,
            verifiedAt: true,
            createdAt: true,
            submittedById: true,
            files: {
              select: {
                id: true,
                fieldId: true,
                originalFileName: true,
                storedFileName: true,
                mimeType: true,
                fileSize: true,
                googleDriveFileId: true,
                googleDriveFolderId: true,
                googleDriveWebViewLink: true,
                googleDriveDownloadLink: true,
                createdAt: true,
              },
            },
          },
        },
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
      } as FormDetail,
    };
  } catch (error) {
    console.error("Error fetching form:", error);
    return { status: "error" as const, message: "Failed to fetch form" };
  }
}

export async function createForm(input: {
  title: string;
  description?: string;
  definition: FormDefinition;
}) {
  const session = await requireAdmin();

  try {
    const formId = await ensureUniqueFormId();
    const form = await prisma.form.create({
      data: {
        id: randomUUID(),
        formId,
        title: input.title.trim(),
        description: input.description || null,
        definition: toJsonValue(input.definition),
        isPublished: false,
        createdById: session?.user?.id || null,
      },
      select: {
        id: true,
        formId: true,
        title: true,
        description: true,
        isPublished: true,
        acceptingResponses: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { responses: true },
        },
      },
    });

    revalidatePath("/admin/forms");
    return { status: "success" as const, message: "Form created successfully", data: form };
  } catch (error) {
    console.error("Error creating form:", error);
    return { status: "error" as const, message: "Failed to create form" };
  }
}

export async function updateForm(
  formId: string,
  input: {
    title: string;
    description?: string;
    definition: FormDefinition;
  }
) {
  await requireAdmin();

  try {
    const form = await prisma.form.update({
      where: { formId },
      data: {
        title: input.title.trim(),
        description: input.description || null,
        definition: toJsonValue(input.definition),
      },
    });

    revalidatePath("/admin/forms");
    revalidatePath(`/admin/forms/${form.formId}`);
    revalidatePath(`/forms/${form.formId}`);

    return { status: "success" as const, message: "Form updated successfully", data: form };
  } catch (error) {
    console.error("Error updating form:", error);
    return { status: "error" as const, message: "Failed to update form" };
  }
}

export async function toggleFormPublish(formId: string, isPublished: boolean) {
  await requireAdmin();

  try {
    const existingForm = await prisma.form.findUnique({
      where: { formId },
      select: { definition: true },
    });

    if (!existingForm) {
      return { status: "error" as const, message: "Form not found" };
    }

    if (isPublished) {
      const formDef = existingForm.definition as unknown as FormDefinition;
      const hasFileUpload = (formDef?.sections || []).some((s) =>
        (s.fields || []).some((f) => f.type === "file_upload")
      );

      if (hasFileUpload) {
        const { GoogleDriveService } = await import("@/lib/google-drive-service");
        const status = await GoogleDriveService.getConnectionStatus();
        if (!status.isConnected) {
          return {
            status: "error" as const,
            message: "This form contains a file upload field, but Google Drive is not connected. Connect Google Drive before publishing this form.",
          };
        }
      }
    }

    const form = await prisma.form.update({
      where: { formId },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    revalidatePath("/admin/forms");
    revalidatePath(`/admin/forms/${form.formId}`);
    revalidatePath(`/forms/${form.formId}`);

    return {
      status: "success" as const,
      message: `Form ${isPublished ? "published" : "unpublished"} successfully`,
      data: form,
    };
  } catch (error) {
    console.error("Error toggling form publish status:", error);
    return { status: "error" as const, message: "Failed to update publish status" };
  }
}

export async function toggleAcceptingResponses(formId: string, accepting: boolean) {
  await requireAdmin();

  try {
    const form = await prisma.form.update({
      where: { formId },
      data: { acceptingResponses: accepting },
    });

    revalidatePath("/admin/forms");
    revalidatePath(`/admin/forms/${form.formId}`);
    revalidatePath(`/forms/${form.formId}`);

    return {
      status: "success" as const,
      message: accepting ? "Form is now accepting responses" : "Form stopped accepting responses",
      data: form,
    };
  } catch (error) {
    console.error("Error toggling accepting responses:", error);
    return { status: "error" as const, message: "Failed to update accepting responses status" };
  }
}

export async function deleteForm(formId: string) {
  await requireAdmin();

  try {
    const form = await prisma.form.findUnique({
      where: { formId },
      select: { id: true, googleDriveFolderId: true },
    });

    if (form?.googleDriveFolderId) {
      try {
        const { GoogleDriveService } = await import("@/lib/google-drive-service");
        const { accessToken } = await GoogleDriveService.getValidAccessToken();
        await GoogleDriveService.deleteFormFolder(form.googleDriveFolderId, accessToken);
      } catch (driveErr) {
        console.warn("Could not delete Google Drive folder for form:", driveErr);
      }
    }

    await prisma.form.delete({
      where: { formId },
    });

    revalidatePath("/admin/forms");
    return { status: "success" as const, message: "Form deleted successfully" };
  } catch (error) {
    console.error("Error deleting form:", error);
    return { status: "error" as const, message: "Failed to delete form" };
  }
}

export async function updateFormResponseStatus(responseId: string, paymentStatus: string) {
  await requireAdmin();

  try {
    const response = await prisma.formResponse.update({
      where: { id: responseId },
      data: {
        paymentStatus,
        verifiedAt: paymentStatus === "verified" ? new Date() : null,
      },
    });

    if (paymentStatus === "verified") {
      const responseDetail = await prisma.formResponse.findUnique({
        where: { id: responseId },
        include: {
          form: {
            select: {
              title: true,
              definition: true,
            },
          },
        },
      });

      // ONLY send invoice email if the response contains a transaction ID
      if (responseDetail && responseDetail.transactionId && responseDetail.transactionId.trim()) {
        const formDef = responseDetail.form.definition as unknown as FormDefinition;
        const answersObj = (responseDetail.answers || {}) as Record<string, unknown>;

        let recipientEmail = "";
        let recipientName = "";
        let collegeName = "";

        for (const [k, v] of Object.entries(answersObj)) {
          if (typeof v === "string") {
            const valStr = v.trim();
            const keyLower = k.toLowerCase();
            if (!recipientEmail && (keyLower.includes("email") || (valStr.includes("@") && valStr.includes(".")))) {
              recipientEmail = valStr;
            }
            if (!recipientName && keyLower.includes("name") && valStr) {
              recipientName = valStr;
            }
            if (!collegeName && (keyLower.includes("college") || keyLower.includes("school") || keyLower.includes("organization")) && valStr) {
              collegeName = valStr;
            }
          }
        }

        let paymentAmount = 0;
        for (const section of formDef.sections || []) {
          for (const field of section.fields || []) {
            if (field.type === "payment" && field.paymentAmount) {
              paymentAmount = field.paymentAmount;
              break;
            }
          }
        }

        if (recipientEmail) {
          const refNo = `CB-INV-${responseDetail.id.slice(0, 8).toUpperCase()}`;
          sendFormResponseInvoiceEmail({
            to: recipientEmail,
            recipientName: recipientName || "Participant",
            formTitle: responseDetail.form.title || "Form",
            referenceNumber: refNo,
            issuedDate: new Date().toLocaleDateString("en-US"),
            transactionId: responseDetail.transactionId.trim(),
            paymentAmount: paymentAmount,
            collegeName: collegeName || undefined,
          }).catch((err) => console.error("Error sending invoice email on approval:", err));
        }
      }
    }

    revalidatePath("/admin/forms");
    revalidatePath(`/admin/forms/${response.formId}`);

    return { status: "success" as const, message: "Response status updated successfully", data: response };
  } catch (error) {
    console.error("Error updating form response status:", error);
    return { status: "error" as const, message: "Failed to update response status" };
  }
}

export async function updateFormResponsesStatus(responseIds: string[], paymentStatus: string) {
  await requireAdmin();

  try {
    await prisma.formResponse.updateMany({
      where: { id: { in: responseIds } },
      data: {
        paymentStatus,
        verifiedAt: paymentStatus === "verified" ? new Date() : null,
      },
    });

    if (paymentStatus === "verified" && responseIds.length > 0) {
      const responsesToEmail = await prisma.formResponse.findMany({
        where: { id: { in: responseIds } },
        include: {
          form: {
            select: {
              title: true,
              definition: true,
            },
          },
        },
      });

      for (const resItem of responsesToEmail) {
        // ONLY send invoice email if the response contains a transaction ID
        if (!resItem.transactionId || !resItem.transactionId.trim()) {
          continue;
        }

        const formDef = resItem.form.definition as unknown as FormDefinition;
        const answersObj = (resItem.answers || {}) as Record<string, unknown>;

        let recipientEmail = "";
        let recipientName = "";
        let collegeName = "";

        for (const [k, v] of Object.entries(answersObj)) {
          if (typeof v === "string") {
            const valStr = v.trim();
            const keyLower = k.toLowerCase();
            if (!recipientEmail && (keyLower.includes("email") || (valStr.includes("@") && valStr.includes(".")))) {
              recipientEmail = valStr;
            }
            if (!recipientName && keyLower.includes("name") && valStr) {
              recipientName = valStr;
            }
            if (!collegeName && (keyLower.includes("college") || keyLower.includes("organization")) && valStr) {
              collegeName = valStr;
            }
          }
        }

        let paymentAmount = 0;
        for (const section of formDef.sections || []) {
          for (const field of section.fields || []) {
            if (field.type === "payment" && field.paymentAmount) {
              paymentAmount = field.paymentAmount;
              break;
            }
          }
        }

        if (recipientEmail) {
          const refNo = `CB-INV-${resItem.id.slice(0, 8).toUpperCase()}`;
          sendFormResponseInvoiceEmail({
            to: recipientEmail,
            recipientName: recipientName || "Participant",
            formTitle: resItem.form.title || "Form",
            referenceNumber: refNo,
            issuedDate: new Date().toLocaleDateString("en-US"),
            transactionId: resItem.transactionId.trim(),
            paymentAmount: paymentAmount,
            collegeName: collegeName || undefined,
          }).catch((err) => console.error("Error sending bulk approval invoice email:", err));
        }
      }
    }

    revalidatePath("/admin/forms");

    return { status: "success" as const, message: `${responseIds.length} responses updated successfully` };
  } catch (error) {
    console.error("Error bulk updating form responses status:", error);
    return { status: "error" as const, message: "Failed to update responses" };
  }
}

export async function deleteFormResponse(responseId: string) {
  await requireAdmin();

  try {
    // Find associated files to delete from Google Drive
    const files = await prisma.formFile.findMany({
      where: { responseId },
      select: { googleDriveFileId: true },
    });

    if (files.length > 0) {
      try {
        const { GoogleDriveService } = await import("@/lib/google-drive-service");
        const { accessToken } = await GoogleDriveService.getValidAccessToken();
        for (const f of files) {
          if (f.googleDriveFileId) {
            await GoogleDriveService.deleteFile(f.googleDriveFileId, accessToken);
          }
        }
      } catch (driveErr) {
        console.warn("Could not delete files from Google Drive:", driveErr);
      }
    }

    await prisma.formResponse.delete({
      where: { id: responseId },
    });

    revalidatePath("/admin/forms");

    return { status: "success" as const, message: "Response deleted successfully" };
  } catch (error) {
    console.error("Error deleting form response:", error);
    return { status: "error" as const, message: "Failed to delete response" };
  }
}

export async function deleteFormResponses(responseIds: string[]) {
  await requireAdmin();

  try {
    // Find associated files to delete from Google Drive
    const files = await prisma.formFile.findMany({
      where: { responseId: { in: responseIds } },
      select: { googleDriveFileId: true },
    });

    if (files.length > 0) {
      try {
        const { GoogleDriveService } = await import("@/lib/google-drive-service");
        const { accessToken } = await GoogleDriveService.getValidAccessToken();
        for (const f of files) {
          if (f.googleDriveFileId) {
            await GoogleDriveService.deleteFile(f.googleDriveFileId, accessToken);
          }
        }
      } catch (driveErr) {
        console.warn("Could not bulk delete files from Google Drive:", driveErr);
      }
    }

    await prisma.formResponse.deleteMany({
      where: { id: { in: responseIds } },
    });

    revalidatePath("/admin/forms");

    return { status: "success" as const, message: `${responseIds.length} responses deleted successfully` };
  } catch (error) {
    console.error("Error bulk deleting form responses:", error);
    return { status: "error" as const, message: "Failed to delete responses" };
  }
}

export async function normalizeFormDefinition(definition: FormDefinition) {
  return normalizeDefinition(definition);
}
