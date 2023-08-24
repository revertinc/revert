/*
  Warnings:

  - You are about to drop the column `schema_mapping_id` on the `fieldMappings` table. All the data in the column will be lost.
  - You are about to drop the column `field_mapping_config_id` on the `schema_mapping` table. All the data in the column will be lost.
  - Added the required column `schema_id` to the `fieldMappings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schema_mapping_id` to the `schemas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "fieldMappings" DROP CONSTRAINT "fieldMappings_schema_mapping_id_fkey";

-- DropForeignKey
ALTER TABLE "fieldMappings" DROP CONSTRAINT "fieldMappings_target_schema_id_fkey";

-- AlterTable
ALTER TABLE "fieldMappings" DROP COLUMN "schema_mapping_id",
ADD COLUMN     "schema_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "schema_mapping" DROP COLUMN "field_mapping_config_id",
ADD COLUMN     "object_schema_ids" TEXT[];

-- AlterTable
ALTER TABLE "schemas" ADD COLUMN     "fields_mapping_ids" TEXT[],
ADD COLUMN     "schema_mapping_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "schemas" ADD CONSTRAINT "schemas_schema_mapping_id_fkey" FOREIGN KEY ("schema_mapping_id") REFERENCES "schema_mapping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fieldMappings" ADD CONSTRAINT "fieldMappings_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "schemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
