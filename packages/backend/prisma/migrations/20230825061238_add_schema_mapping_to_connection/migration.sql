-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "schema_mapping_id" TEXT;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_schema_mapping_id_fkey" FOREIGN KEY ("schema_mapping_id") REFERENCES "schema_mapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;
