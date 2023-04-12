/*
  Warnings:

  - You are about to drop the column `x_revert_private_token` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `x_revert_public_token` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `owner_account_x_revert_public_token` on the `connections` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[private_token]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[public_token]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `owner_account_public_token` to the `connections` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "connections" DROP CONSTRAINT "connections_owner_account_x_revert_public_token_fkey";

-- DropIndex
DROP INDEX "accounts_x_revert_private_token_key";

-- DropIndex
DROP INDEX "accounts_x_revert_public_token_key";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "x_revert_private_token",
DROP COLUMN "x_revert_public_token",
ADD COLUMN     "private_token" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "public_token" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "connections" DROP COLUMN "owner_account_x_revert_public_token",
ADD COLUMN     "owner_account_public_token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_private_token_key" ON "accounts"("private_token");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_public_token_key" ON "accounts"("public_token");

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_owner_account_public_token_fkey" FOREIGN KEY ("owner_account_public_token") REFERENCES "accounts"("public_token") ON DELETE RESTRICT ON UPDATE CASCADE;
