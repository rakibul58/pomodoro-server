/*
  Warnings:

  - You are about to drop the column `type` on the `Badge` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,category,level]` on the table `Badge` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `criteria` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `Badge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Badge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FocusLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('COMPLETED', 'INTERRUPTED', 'PAUSED');

-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('STREAK', 'MILESTONE', 'TIME', 'CONSISTENCY', 'SPECIAL');

-- AlterTable
ALTER TABLE "Badge" DROP COLUMN "type",
ADD COLUMN     "category" "BadgeCategory" NOT NULL,
ADD COLUMN     "criteria" JSONB NOT NULL,
ADD COLUMN     "icon" TEXT NOT NULL,
ADD COLUMN     "level" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FocusSession" ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'COMPLETED';

-- AlterTable
ALTER TABLE "Streak" ADD COLUMN     "maxStreak" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "focusLevel" "FocusLevel" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "totalMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Badge_userId_category_level_key" ON "Badge"("userId", "category", "level");
