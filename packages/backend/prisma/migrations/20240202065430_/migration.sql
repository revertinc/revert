/*
  Warnings:

  - The values [ms_dyamics_365_sales] on the enum `TP_ID` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TP_ID_new" AS ENUM ('hubspot', 'zohocrm', 'sfdc', 'pipedrive', 'closecrm', 'ms_dynamics_365_sales', 'slack', 'discord', 'linear', 'clickup', 'asana', 'trello', 'jira','gdrive');
ALTER TABLE "apps" ALTER COLUMN "tp_id" TYPE "TP_ID_new" USING ("tp_id"::text::"TP_ID_new");
ALTER TABLE "connections" ALTER COLUMN "tp_id" TYPE "TP_ID_new" USING ("tp_id"::text::"TP_ID_new");
ALTER TABLE "fieldMappings" ALTER COLUMN "source_tp_id" TYPE "TP_ID_new" USING ("source_tp_id"::text::"TP_ID_new");
ALTER TYPE "TP_ID" RENAME TO "TP_ID_old";
ALTER TYPE "TP_ID_new" RENAME TO "TP_ID";
DROP TYPE "TP_ID_old";
COMMIT;
