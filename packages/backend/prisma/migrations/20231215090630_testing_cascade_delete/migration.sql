-- DropForeignKey
ALTER TABLE "schemas" DROP CONSTRAINT "schemas_schema_mapping_id_fkey";

-- AddForeignKey
ALTER TABLE "schemas" ADD CONSTRAINT "schemas_schema_mapping_id_fkey" FOREIGN KEY ("schema_mapping_id") REFERENCES "schema_mapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
