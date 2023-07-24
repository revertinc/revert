-- CreateEnum
CREATE TYPE "ENV" AS ENUM ('development', 'production');

-- CreateTable
CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "env" "ENV" NOT NULL,
    "private_token" TEXT NOT NULL,
    "public_token" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "environments_private_token_key" ON "environments"("private_token");

-- CreateIndex
CREATE UNIQUE INDEX "environments_public_token_key" ON "environments"("public_token");

-- AddForeignKey
ALTER TABLE "environments" ADD CONSTRAINT "environments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
