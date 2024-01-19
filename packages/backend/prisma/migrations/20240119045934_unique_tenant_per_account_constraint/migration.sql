/*
  Warnings:

  - A unique constraint covering the columns `[tp_customer_id,t_id]` on the table `connections` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tp_id,t_id]` on the table `connections` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tp_customer_id,t_id,tp_id]` on the table `connections` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[t_id,accountId]` on the table `connections` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "connections_accountId_tp_customer_id_t_id_key";

-- DropIndex
DROP INDEX "connections_accountId_tp_customer_id_t_id_tp_id_key";

-- DropIndex
DROP INDEX "connections_accountId_tp_id_t_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "connections_tp_customer_id_t_id_key" ON "connections"("tp_customer_id", "t_id");

-- CreateIndex
CREATE UNIQUE INDEX "connections_tp_id_t_id_key" ON "connections"("tp_id", "t_id");

-- CreateIndex
CREATE UNIQUE INDEX "connections_tp_customer_id_t_id_tp_id_key" ON "connections"("tp_customer_id", "t_id", "tp_id");

-- CreateIndex
CREATE UNIQUE INDEX "connections_t_id_accountId_key" ON "connections"("t_id", "accountId");
