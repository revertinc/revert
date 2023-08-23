-- CreateEnum
CREATE TYPE "OBJECT_TYPES" AS ENUM ('company', 'contact', 'deal', 'event', 'lead', 'note', 'task', 'user');

-- CreateTable
CREATE TABLE "schemas" (
    "id" TEXT NOT NULL,
    "object" "OBJECT_TYPES" NOT NULL,
    "fields" TEXT[],

    CONSTRAINT "schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fieldMappings" (
    "id" TEXT NOT NULL,
    "source_tp_id" "TP_ID" NOT NULL,
    "target_schema_id" TEXT NOT NULL,
    "source_field_name" TEXT NOT NULL,
    "target_field_name" TEXT NOT NULL,
    "is_standard_field" BOOLEAN NOT NULL,
    "schema_mapping_id" TEXT,

    CONSTRAINT "fieldMappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_mapping" (
    "id" TEXT NOT NULL,
    "field_mapping_config_id" TEXT[],

    CONSTRAINT "schema_mapping_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fieldMappings" ADD CONSTRAINT "fieldMappings_target_schema_id_fkey" FOREIGN KEY ("target_schema_id") REFERENCES "schemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fieldMappings" ADD CONSTRAINT "fieldMappings_schema_mapping_id_fkey" FOREIGN KEY ("schema_mapping_id") REFERENCES "schema_mapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;
