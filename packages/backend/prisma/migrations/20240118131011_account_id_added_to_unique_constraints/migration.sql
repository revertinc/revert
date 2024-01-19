/*
  Warnings:

  - A unique constraint covering the columns `[accountId,tp_customer_id,t_id]` on the table `connections` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accountId,tp_id,t_id]` on the table `connections` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accountId,tp_customer_id,t_id,tp_id]` on the table `connections` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "connections_tp_customer_id_t_id_key";

-- DropIndex
DROP INDEX "connections_tp_customer_id_t_id_tp_id_key";

-- DropIndex
DROP INDEX "connections_tp_id_t_id_key";

-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "accountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "connections_accountId_tp_customer_id_t_id_key" ON "connections"("accountId", "tp_customer_id", "t_id");

-- CreateIndex
CREATE UNIQUE INDEX "connections_accountId_tp_id_t_id_key" ON "connections"("accountId", "tp_id", "t_id");

-- CreateIndex
CREATE UNIQUE INDEX "connections_accountId_tp_customer_id_t_id_tp_id_key" ON "connections"("accountId", "tp_customer_id", "t_id", "tp_id");

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
