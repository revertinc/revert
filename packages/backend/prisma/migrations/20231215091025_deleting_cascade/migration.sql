-- DropForeignKey
ALTER TABLE "fieldMappings" DROP CONSTRAINT "fieldMappings_schema_id_fkey";

-- AddForeignKey
ALTER TABLE "fieldMappings" ADD CONSTRAINT "fieldMappings_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
