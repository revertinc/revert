/*
  Warnings:

  - You are about to drop the column `owner_account_public_token` on the `connections` table. All the data in the column will be lost.
  - You are about to drop the column `tp_id` on the `connections` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tp_unique_id,t_id]` on the table `connections` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tp_customer_id,t_id,tp_unique_id]` on the table `connections` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tp_unique_id` to the `connections` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TP_ID" AS ENUM ('hubspot', 'zohocrm', 'sfdc');

-- CreateEnum
CREATE TYPE "TP_TYPE" AS ENUM ('CUSTOMER', 'REVERT');

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- CreateTable
CREATE TABLE "tp_client" (
    "id" TEXT NOT NULL,
    "tp_id" "TP_ID" NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" "TP_TYPE" NOT NULL,

    CONSTRAINT "tp_client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tp_client_tp_id_account_id_key" ON "tp_client"("tp_id", "account_id");

-- AddForeignKey
ALTER TABLE "tp_client" ADD CONSTRAINT "tp_client_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- Insert Dummy data to tp_client
INSERT INTO "tp_client" ("id", "tp_id", "client_id", "client_secret", "account_id", "type") VALUES(uuid_generate_v4()) UNION SELECT 'hubspot', 'hubspot_client_id', 'hubspot_client_secret', "id", 'REVERT' FROM "accounts";
INSERT INTO "tp_client" ("id", "tp_id", "client_id", "client_secret", "account_id", "type") VALUES(uuid_generate_v4()) UNION SELECT 'zohocrm', 'zohocrm_client_id', 'zohocrm_client_secret', "id", 'REVERT' FROM "accounts";
INSERT INTO "tp_client" ("id", "tp_id", "client_id", "client_secret", "account_id", "type") VALUES(uuid_generate_v4()) UNION SELECT 'sfdc', 'sfdc_client_id', 'sfdc_client_secret', "id", 'REVERT' FROM "accounts";


-- AlterTable
ALTER TABLE "connections" ADD COLUMN "tp_unique_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "connections_tp_unique_id_t_id_key" ON "connections"("tp_unique_id", "t_id");

-- CreateIndex
CREATE UNIQUE INDEX "connections_tp_customer_id_t_id_tp_unique_id_key" ON "connections"("tp_customer_id", "t_id", "tp_unique_id");

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_tp_unique_id_fkey" FOREIGN KEY ("tp_unique_id") REFERENCES "tp_client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AlterTable
INSERT INTO "connections" ("tp_unique_id") SELECT "tp_client"."id" FROM "tp_client", "accounts", "connections" WHERE "connections"."owner_account_public_token" = "accounts"."public_token" AND "tp_client"."account_id" = "accounts"."id" AND "connections"."tp_id"::"TP_ID" = "tp_client"."tp_id";

ALTER TABLE "connections" ALTER COLUMN "tp_unique_id" SET NOT NULL;


-- DropForeignKey
ALTER TABLE "connections" DROP CONSTRAINT "connections_owner_account_public_token_fkey";

-- DropIndex
DROP INDEX "connections_tp_customer_id_t_id_tp_id_key";

-- DropIndex
DROP INDEX "connections_tp_id_t_id_key";

-- Drop Columns
ALTER TABLE "connections" DROP COLUMN "owner_account_public_token",
DROP COLUMN "tp_id";



