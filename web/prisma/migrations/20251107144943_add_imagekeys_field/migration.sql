/*
  Warnings:

  - Added the required column `rules` to the `event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venue` to the `event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event" ADD COLUMN     "imageKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rules" TEXT NOT NULL,
ADD COLUMN     "venue" TEXT NOT NULL;
