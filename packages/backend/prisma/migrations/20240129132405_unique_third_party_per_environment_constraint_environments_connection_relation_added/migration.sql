/*
  Warnings:

  - A unique constraint covering the columns `[tp_id,environmentId]` on the table `connections` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "environmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "connections_tp_id_environmentId_key" ON "connections"("tp_id", "environmentId");

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
