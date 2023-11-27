/*
  Warnings:

  - You are about to drop the column `app_bot_token` on the `apps` table. All the data in the column will be lost.
  - You are about to drop the column `app_bot_token` on the `connections` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "apps" DROP COLUMN "app_bot_token";

-- AlterTable
ALTER TABLE "connections" DROP COLUMN "app_bot_token";
