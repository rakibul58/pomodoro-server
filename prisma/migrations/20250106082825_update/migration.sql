/*
  Warnings:

  - The values [CONSISTENCY] on the enum `BadgeCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BadgeCategory_new" AS ENUM ('STREAK', 'MILESTONE', 'TIME', 'SPECIAL');
ALTER TABLE "Badge" ALTER COLUMN "category" TYPE "BadgeCategory_new" USING ("category"::text::"BadgeCategory_new");
ALTER TYPE "BadgeCategory" RENAME TO "BadgeCategory_old";
ALTER TYPE "BadgeCategory_new" RENAME TO "BadgeCategory";
DROP TYPE "BadgeCategory_old";
COMMIT;
