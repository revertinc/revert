-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "app_bot_token" TEXT;

-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "app_bot_token" TEXT;
