/*
  Warnings:

  - Made the column `environmentId` on table `apps` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "apps" ALTER COLUMN "environmentId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_appsId_fkey" FOREIGN KEY ("appsId") REFERENCES "apps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
