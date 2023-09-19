/*
  Warnings:

  - Changed the type of `mappable_by_connection_field_list` on the `accountFieldMappingConfig` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "accountFieldMappingConfig" ALTER COLUMN "mappable_by_connection_field_list" DROP NOT NULL, DROP COLUMN "mappable_by_connection_field_list",
ADD COLUMN     "mappable_by_connection_field_list" JSONB;
