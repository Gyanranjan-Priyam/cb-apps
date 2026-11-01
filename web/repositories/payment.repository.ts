import { prisma } from "@/lib/db";

export class PaymentRepository {
  /**
   * Find form response by transaction ID or ID
   */
  static async findResponseByTransactionId(transactionId: string) {
    return prisma.formResponse.findFirst({
      where: {
        OR: [
          { transactionId },
          { id: transactionId },
        ],
      },
      include: {
        form: true,
        submittedBy: true,
      },
    });
  }

  /**
   * Update payment status of a form response
   */
  static async updateResponsePaymentStatus(
    responseId: string,
    paymentStatus: string,
    transactionId?: string,
    verifiedById?: string
  ) {
    return prisma.formResponse.update({
      where: { id: responseId },
      data: {
        paymentStatus,
        ...(transactionId ? { transactionId } : {}),
        ...(paymentStatus === "completed" || paymentStatus === "verified"
          ? {
              verifiedAt: new Date(),
              verifiedById: verifiedById || null,
            }
          : {}),
      },
      include: {
        form: true,
        submittedBy: true,
      },
    });
  }

  /**
   * Get payment & submission history for a user
   */
  static async getUserPayments(userId: string) {
    return prisma.formResponse.findMany({
      where: {
        submittedById: userId,
        transactionId: { not: null },
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            formId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
