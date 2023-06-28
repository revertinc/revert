/*
  Warnings:

  - You are about to drop the column `app_client_id` on the `connections` table. All the data in the column will be lost.
  - You are about to drop the column `app_client_secret` on the `connections` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `connections` table. All the data in the column will be lost.
  - Changed the type of `tp_id` on the `connections` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TP_ID" AS ENUM ('hubspot', 'zohocrm', 'sfdc');

-- AlterTable
ALTER TABLE "connections" DROP COLUMN "app_client_id",
DROP COLUMN "app_client_secret",
DROP COLUMN "scope",
DROP COLUMN "tp_id",
ADD COLUMN     "tp_id" "TP_ID" NOT NULL;

-- CreateTable
CREATE TABLE "apps" (
    "id" TEXT NOT NULL,
    "tp_id" "TP_ID" NOT NULL,
    "scope" TEXT[],
    "app_client_id" TEXT,
    "app_client_secret" TEXT,
    "owner_account_public_token" TEXT NOT NULL,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connections_tp_id_t_id_key" ON "connections"("tp_id", "t_id");

-- CreateIndex
CREATE UNIQUE INDEX "connections_tp_customer_id_t_id_tp_id_key" ON "connections"("tp_customer_id", "t_id", "tp_id");

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_owner_account_public_token_fkey" FOREIGN KEY ("owner_account_public_token") REFERENCES "accounts"("public_token") ON DELETE RESTRICT ON UPDATE CASCADE;
