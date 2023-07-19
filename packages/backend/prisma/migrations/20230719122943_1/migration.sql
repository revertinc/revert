/*
  Warnings:

  - You are about to drop the column `env` on the `apps` table. All the data in the column will be lost.
  - Added the required column `environmentId` to the `apps` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "apps" DROP CONSTRAINT "apps_owner_account_public_token_fkey";

-- DropForeignKey
ALTER TABLE "connections" DROP CONSTRAINT "connections_owner_account_public_token_tp_id_fkey";

-- DropIndex
DROP INDEX "apps_owner_account_public_token_tp_id_key";

-- AlterTable
ALTER TABLE "apps" DROP COLUMN "env",
ADD COLUMN     "environmentId" TEXT;

-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "appsId" TEXT;

-- -- AddForeignKey
-- ALTER TABLE "apps" ADD CONSTRAINT "apps_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE "connections" ADD CONSTRAINT "connections_appsId_fkey" FOREIGN KEY ("appsId") REFERENCES "apps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
