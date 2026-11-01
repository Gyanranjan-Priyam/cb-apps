"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface TransactionNotification {
  id: string;
  type: "SUBMISSION_RECEIVED" | "PAYMENT_VERIFIED" | "PAYMENT_PENDING" | "PAYMENT_REJECTED" | "EMAIL_SENT";
  title: string;
  message: string;
  timestamp: string;
  recipientEmail?: string;
  status: "success" | "warning" | "info" | "error";
}

export interface UserTransactionItem {
  id: string;
  formId: string;
  formTitle: string;
  referenceNumber: string;
  transactionId: string | null;
  paymentStatus: "verified" | "pending" | "rejected" | "submitted" | string;
  paymentAmount: number;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string | null;
  answers: Record<string, unknown>;
  createdAt: string;
  verifiedAt: string | null;
  verifierName: string | null;
  notifications: TransactionNotification[];
  formDefinition?: any;
}

export interface UserTransactionsSummary {
  totalTransactions: number;
  totalPaidAmount: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
}

export interface UserProfileInfo {
  id: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  whatsappNumber: string | null;
  upiId: string | null;
  collegeName: string | null;
  rollNumber: string | null;
  registration: string | null;
  branch: string | null;
  cbUserId: string | null;
  image: string | null;
}

export interface UserTransactionsResponse {
  user: UserProfileInfo;
  transactions: UserTransactionItem[];
  summary: UserTransactionsSummary;
}

function isValidTransactionId(txId: string | null | undefined): boolean {
  if (!txId || typeof txId !== "string") return false;
  const trimmed = txId.trim();
  if (trimmed.length < 3) return false;
  const lower = trimmed.toLowerCase();
  if (["null", "undefined", "n/a", "na", "none", "nil", "0", "0000", "dummy", "fake"].includes(lower)) {
    return false;
  }
  return true;
}

function cleanDigits(val: string | null | undefined): string {
  if (!val) return "";
  const digits = val.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function extractDeepString(obj: unknown, keywords: string[]): string | null {
  if (!obj) return null;
  if (typeof obj === "string") {
    return obj.trim();
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const keyLower = k.toLowerCase();
      if (keywords.some((kw) => keyLower.includes(kw)) && typeof v === "string" && v.trim()) {
        return v.trim();
      }
      if (typeof v === "object" && v !== null) {
        const nested = extractDeepString(v, keywords);
        if (nested) return nested;
      }
    }
  }
  return null;
}

function extractPaymentAmount(definitionJson: unknown): number {
  try {
    const def = typeof definitionJson === "string" ? JSON.parse(definitionJson) : definitionJson;
    if (def && Array.isArray(def.sections)) {
      for (const sec of def.sections) {
        if (Array.isArray(sec.fields)) {
          for (const f of sec.fields) {
            if (f.type === "payment" && f.paymentAmount !== undefined) {
              return Number(f.paymentAmount);
            }
          }
        }
      }
    }
  } catch {
    // fallback
  }
  return 0;
}

export async function getUserTransactionsData(): Promise<UserTransactionsResponse | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      mobileNumber: true,
      whatsappNumber: true,
      upiId: true,
      collegeName: true,
      rollNumber: true,
      registration: true,
      branch: true,
      cbUserId: true,
      image: true,
    },
  });

  if (!user) {
    return null;
  }

  const userEmailLower = user.email.toLowerCase().trim();
  const cleanMobile = cleanDigits(user.mobileNumber);
  const cleanWhatsapp = cleanDigits(user.whatsappNumber);

  // Fetch all form responses with forms
  const allFormResponses = await prisma.formResponse.findMany({
    include: {
      form: {
        select: {
          id: true,
          formId: true,
          title: true,
          definition: true,
        },
      },
      verifiedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Filter responses that belong to this user AND have a valid Transaction ID
  const userResponses = allFormResponses.filter((res) => {
    // 0. Filter: Do not show forms in the Transaction section if they do not contain a valid Transaction ID
    if (!isValidTransactionId(res.transactionId)) {
      return false;
    }

    // 1. Direct submitter linkage
    if (res.submittedById && res.submittedById === user.id) {
      return true;
    }

    const answersJsonStr = JSON.stringify(res.answers || {}).toLowerCase();

    // 2. Email matching anywhere inside answers JSON
    if (answersJsonStr.includes(`"${userEmailLower}"`) || answersJsonStr.includes(userEmailLower)) {
      return true;
    }

    // 3. Phone number matching in answers JSON
    if (cleanMobile && cleanMobile.length === 10 && answersJsonStr.includes(cleanMobile)) {
      return true;
    }
    if (cleanWhatsapp && cleanWhatsapp.length === 10 && answersJsonStr.includes(cleanWhatsapp)) {
      return true;
    }

    // 4. Registration number matching in answers JSON
    if (user.registration && user.registration.trim() && answersJsonStr.includes(user.registration.toLowerCase().trim())) {
      return true;
    }

    return false;
  });

  let totalPaidAmount = 0;
  let verifiedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  const transactions: UserTransactionItem[] = userResponses.map((res) => {
    const answersObj = (res.answers || {}) as Record<string, unknown>;
    const formTitle = res.form?.title || "Form Submission";
    const amount = extractPaymentAmount(res.form?.definition);
    const referenceNumber = `CB-INV-${res.id.slice(0, 8).toUpperCase()}`;

    const recipientName =
      extractDeepString(answersObj, ["name", "full name", "fullname"]) || user.name;
    const recipientEmail =
      extractDeepString(answersObj, ["email", "mail"]) || user.email;
    const recipientPhone =
      extractDeepString(answersObj, ["phone", "mobile", "whatsapp", "contact"]) ||
      user.mobileNumber ||
      user.whatsappNumber;

    if (res.paymentStatus === "verified") {
      verifiedCount++;
      totalPaidAmount += amount;
    } else if (res.paymentStatus === "pending") {
      pendingCount++;
    } else if (res.paymentStatus === "rejected") {
      rejectedCount++;
    }

    // Build timeline of messages & notifications for this transaction
    const notifications: TransactionNotification[] = [];

    // 1. Submission notice
    notifications.push({
      id: `${res.id}-sub`,
      type: "SUBMISSION_RECEIVED",
      title: "Submission Recorded & Invoice Created",
      message: `Your response for "${formTitle}" was successfully received. Transaction reference: ${referenceNumber}.`,
      timestamp: res.createdAt.toISOString(),
      recipientEmail,
      status: "info",
    });

    // 2. Email confirmation notice
    if (recipientEmail) {
      notifications.push({
        id: `${res.id}-email`,
        type: "EMAIL_SENT",
        title: "Confirmation Email Dispatched",
        message: `Submission confirmation email with reference ${referenceNumber} was sent to ${recipientEmail}.`,
        timestamp: res.createdAt.toISOString(),
        recipientEmail,
        status: "info",
      });
    }

    // 3. Payment Status Notice
    if (res.paymentStatus === "verified") {
      notifications.push({
        id: `${res.id}-ver`,
        type: "PAYMENT_VERIFIED",
        title: "Payment Verified & Official Receipt Ready",
        message: `Payment of ₹${amount} was verified by ${res.verifiedBy?.name || "CodeBreakers Finance Desk"}. Your official invoice receipt is generated and ready to download.`,
        timestamp: res.verifiedAt ? res.verifiedAt.toISOString() : res.updatedAt.toISOString(),
        status: "success",
      });
    } else if (res.paymentStatus === "pending") {
      notifications.push({
        id: `${res.id}-pen`,
        type: "PAYMENT_PENDING",
        title: "Payment Verification In Progress",
        message: res.transactionId
          ? `Transaction ID (${res.transactionId}) has been logged and is pending review by the team.`
          : "Your submission is queued for verification.",
        timestamp: res.createdAt.toISOString(),
        status: "warning",
      });
    } else if (res.paymentStatus === "rejected") {
      notifications.push({
        id: `${res.id}-rej`,
        type: "PAYMENT_REJECTED",
        title: "Payment Verification Flagged",
        message:
          "Verification was rejected. Please contact CodeBreakers coordinators with your payment proof.",
        timestamp: res.updatedAt.toISOString(),
        status: "error",
      });
    }

    return {
      id: res.id,
      formId: res.formId,
      formTitle,
      referenceNumber,
      transactionId: res.transactionId || null,
      paymentStatus: res.paymentStatus,
      paymentAmount: amount,
      recipientName,
      recipientEmail,
      recipientPhone,
      answers: answersObj,
      createdAt: res.createdAt.toISOString(),
      verifiedAt: res.verifiedAt ? res.verifiedAt.toISOString() : null,
      verifierName: res.verifiedBy?.name || null,
      notifications,
      formDefinition: res.form?.definition || null,
    };
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      whatsappNumber: user.whatsappNumber,
      upiId: user.upiId,
      collegeName: user.collegeName,
      rollNumber: user.rollNumber,
      registration: user.registration,
      branch: user.branch,
      cbUserId: user.cbUserId,
      image: user.image,
    },
    transactions,
    summary: {
      totalTransactions: transactions.length,
      totalPaidAmount,
      verifiedCount,
      pendingCount,
      rejectedCount,
    },
  };
}
