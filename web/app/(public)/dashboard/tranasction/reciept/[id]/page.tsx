import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { FormDefinition } from "@/lib/form-types";
import { ReceiptClientView } from "@/app/admin/receipt/[responseId]/_components/receipt-client-view";
import type { Metadata } from "next";

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Official Payment Receipt | Dashboard",
  description: "Official CodeBreakers payment and registration receipt.",
};

export default async function DashboardTransactionReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;

  const response = await prisma.formResponse.findUnique({
    where: { id },
    include: {
      form: {
        select: {
          id: true,
          formId: true,
          title: true,
          definition: true,
        },
      },
    },
  });

  if (!response) {
    notFound();
  }

  const formDef = response.form.definition as unknown as FormDefinition;
  const answersObj = (response.answers || {}) as Record<string, unknown>;

  let recipientName = "Participant";
  let recipientEmail = "";
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

  const receiptData = {
    responseId: response.id,
    referenceNumber: `CB-INV-${response.id.slice(0, 8).toUpperCase()}`,
    formTitle: response.form.title || "Form",
    formId: response.form.formId,
    recipientName: recipientName || "Participant",
    recipientEmail: recipientEmail || "Not provided",
    collegeName: collegeName || undefined,
    transactionId: response.transactionId || "N/A",
    paymentStatus: response.paymentStatus,
    paymentAmount: paymentAmount,
    submittedAt: response.createdAt.toISOString(),
    verifiedAt: response.verifiedAt ? response.verifiedAt.toISOString() : null,
  };

  return <ReceiptClientView receipt={receiptData} />;
}
