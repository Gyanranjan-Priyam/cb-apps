-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ParticipationStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "ParticipationStatus" ADD VALUE 'PAYMENT_SUBMITTED';

-- AlterTable
ALTER TABLE "participation" ADD COLUMN     "paymentAmount" INTEGER,
ADD COLUMN     "paymentScreenshotKey" TEXT,
ADD COLUMN     "paymentSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "paymentVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "transactionId" TEXT;
