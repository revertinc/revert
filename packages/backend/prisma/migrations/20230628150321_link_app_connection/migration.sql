/*
  Warnings:

  - A unique constraint covering the columns `[owner_account_public_token,tp_id]` on the table `apps` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "connections" DROP CONSTRAINT "connections_owner_account_public_token_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "apps_owner_account_public_token_tp_id_key" ON "apps"("owner_account_public_token", "tp_id");

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_owner_account_public_token_tp_id_fkey" FOREIGN KEY ("owner_account_public_token", "tp_id") REFERENCES "apps"("owner_account_public_token", "tp_id") ON DELETE RESTRICT ON UPDATE CASCADE;
