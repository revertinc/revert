-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "accountId" TEXT;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
