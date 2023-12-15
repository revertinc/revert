-- DropForeignKey
ALTER TABLE "fieldMappings" DROP CONSTRAINT "fieldMappings_schema_id_fkey";

-- DropForeignKey
ALTER TABLE "schemas" DROP CONSTRAINT "schemas_schema_mapping_id_fkey";

-- AddForeignKey
ALTER TABLE "schemas" ADD CONSTRAINT "schemas_schema_mapping_id_fkey" FOREIGN KEY ("schema_mapping_id") REFERENCES "schema_mapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fieldMappings" ADD CONSTRAINT "fieldMappings_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
