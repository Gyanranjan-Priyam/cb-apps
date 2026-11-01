/*
  Warnings:

  - A unique constraint covering the columns `[slugId]` on the table `team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamCode]` on the table `team` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "team" ADD COLUMN     "slugId" TEXT,
ADD COLUMN     "teamCode" TEXT;

-- AlterTable
ALTER TABLE "team_member" ADD COLUMN     "aadhaarNumber" TEXT,
ADD COLUMN     "collegeAddress" TEXT,
ADD COLUMN     "collegeName" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "pinCode" TEXT,
ADD COLUMN     "profileImageKey" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- CreateTable
CREATE TABLE "team_join_request" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "aadhaarNumber" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "collegeAddress" TEXT NOT NULL,

    CONSTRAINT "team_join_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_join_request_teamId_participantId_key" ON "team_join_request"("teamId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "team_slugId_key" ON "team"("slugId");

-- CreateIndex
CREATE UNIQUE INDEX "team_teamCode_key" ON "team"("teamCode");

-- AddForeignKey
ALTER TABLE "team_join_request" ADD CONSTRAINT "team_join_request_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_join_request" ADD CONSTRAINT "team_join_request_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
