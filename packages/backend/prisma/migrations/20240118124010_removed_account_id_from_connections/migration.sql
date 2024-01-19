/*
  Warnings:

  - You are about to drop the column `accountId` on the `connections` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "connections" DROP CONSTRAINT "connections_accountId_fkey";

-- DropIndex
DROP INDEX "connections_t_id_accountId_key";

-- AlterTable
ALTER TABLE "connections" DROP COLUMN "accountId";
