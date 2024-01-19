/*
  Warnings:

  - A unique constraint covering the columns `[t_id,accountId]` on the table `connections` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "connections_t_id_accountId_key" ON "connections"("t_id", "accountId");
