-- CreateTable
CREATE TABLE "accountFieldMappingConfig" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "allow_connection_override_custom_fields" BOOLEAN NOT NULL DEFAULT true,
    "mappable_by_connection_field_list" TEXT[],

    CONSTRAINT "accountFieldMappingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accountFieldMappingConfig_account_id_key" ON "accountFieldMappingConfig"("account_id");

-- AddForeignKey
ALTER TABLE "accountFieldMappingConfig" ADD CONSTRAINT "accountFieldMappingConfig_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
