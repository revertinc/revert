/*
  Warnings:

  - You are about to drop the column `token` on the `accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "token",
ADD COLUMN     "x_revert_private_token" TEXT NOT NULL DEFAULT '';
