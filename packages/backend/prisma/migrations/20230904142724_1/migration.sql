/*
  Warnings:

  - The required column `id` was added to the `connections` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "connections" ADD COLUMN  "id" TEXT; 

UPDATE "connections" set id=t_id; 

ALTER TABLE "connections" ALTER COLUMN  "id" SET NOT NULL; 

ALTER TABLE "connections" ADD CONSTRAINT "connections_pkey" PRIMARY KEY ("id");
