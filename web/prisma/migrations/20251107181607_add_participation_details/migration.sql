/*
  Warnings:

  - Added the required column `aadhaarNumber` to the `participation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collegeAddress` to the `participation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collegeName` to the `participation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `participation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `participation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `participation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobileNumber` to the `participation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `participation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "participation" ADD COLUMN     "aadhaarNumber" TEXT NOT NULL,
ADD COLUMN     "collegeAddress" TEXT NOT NULL,
ADD COLUMN     "collegeName" TEXT NOT NULL,
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "mobileNumber" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "whatsappNumber" TEXT;
