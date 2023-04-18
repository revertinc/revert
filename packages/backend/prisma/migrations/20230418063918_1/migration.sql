/*
  Warnings:

  - A unique constraint covering the columns `[tp_customer_id,tp_id,t_id]` on the table `connections` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "connections_tp_customer_id_tp_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "connections_tp_customer_id_tp_id_t_id_key" ON "connections"("tp_customer_id", "tp_id", "t_id");
