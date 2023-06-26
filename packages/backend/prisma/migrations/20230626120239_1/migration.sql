-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "domain" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "skipWaitlist" BOOLEAN NOT NULL DEFAULT false;
