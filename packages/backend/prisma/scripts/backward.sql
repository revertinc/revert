-- AlterTable
ALTER TABLE "apps" ALTER COLUMN "owner_account_public_token" DROP NOT NULL,
ALTER COLUMN "environmentId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

