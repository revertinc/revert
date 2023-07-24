/*
  Warnings:

  - You are about to drop the column `appsId` on the `connections` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "connections" DROP CONSTRAINT "connections_appsId_fkey";

-- AlterTable
ALTER TABLE "connections" DROP COLUMN "appsId",
ADD COLUMN     "appId" TEXT;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
