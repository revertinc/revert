/*
  Warnings:

  - You are about to drop the column `app_bot_token` on the `apps` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "apps" DROP COLUMN "app_bot_token",
ADD COLUMN     "app_config" JSONB;
