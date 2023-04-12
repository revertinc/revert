/*
  Warnings:

  - A unique constraint covering the columns `[x_revert_private_token]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[x_revert_public_token]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `owner_account_x_revert_public_token` to the `connections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "owner_account_x_revert_public_token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_x_revert_private_token_key" ON "accounts"("x_revert_private_token");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_x_revert_public_token_key" ON "accounts"("x_revert_public_token");

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_owner_account_x_revert_public_token_fkey" FOREIGN KEY ("owner_account_x_revert_public_token") REFERENCES "accounts"("x_revert_public_token") ON DELETE RESTRICT ON UPDATE CASCADE;
