/*
  Warnings:

  - Changed the type of `object` on the `schemas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "schemas" ALTER COLUMN "object" TYPE TEXT USING (object::TEXT);

-- DropEnum
DROP TYPE "OBJECT_TYPES";
