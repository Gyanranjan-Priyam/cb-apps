import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export class FormService {
  /**
   * Get form by custom formId or UUID
   */
  static async getForm(formId: string) {
    return prisma.form.findFirst({
      where: {
        OR: [{ formId }, { id: formId }],
      },
    });
  }

  /**
   * List forms (with optional published filter)
   */
  static async listForms(onlyPublished: boolean = true) {
    return prisma.form.findMany({
      where: onlyPublished ? { isPublished: true } : undefined,
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
      },
    });
  }

  /**
   * Submit a response to a form
   */
  static async submitResponse(params: {
    formId: string;
    answers: Record<string, any>;
    submittedById?: string;
    transactionId?: string;
    paymentStatus?: string;
  }) {
    const form = await this.getForm(params.formId);
    if (!form) {
      throw new Error("Form not found");
    }

    if (!form.acceptingResponses) {
      throw new Error("This form is no longer accepting responses");
    }

    const responseId = `resp_${uuidv4()}`;

    const response = await prisma.formResponse.create({
      data: {
        id: responseId,
        formId: form.id,
        answers: params.answers,
        submittedById: params.submittedById || null,
        transactionId: params.transactionId || null,
        paymentStatus: params.paymentStatus || "completed",
      },
    });

    return { response, form };
  }

  /**
   * Get responses for a form (admin)
   */
  static async getFormResponses(formId: string) {
    const form = await this.getForm(formId);
    if (!form) throw new Error("Form not found");

    return prisma.formResponse.findMany({
      where: { formId: form.id },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            cbUserId: true,
            rollNumber: true,
          },
        },
        files: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
