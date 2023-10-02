/*
  Warnings:

  - You are about to drop the column `target_schema_id` on the `fieldMappings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "fieldMappings" DROP COLUMN "target_schema_id";
