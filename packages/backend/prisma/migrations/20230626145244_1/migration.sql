/*
  Warnings:

  - A unique constraint covering the columns `[domain]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "accounts_domain_key" ON "accounts"("domain");
