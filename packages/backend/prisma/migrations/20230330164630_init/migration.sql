-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tenant_count" INTEGER,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "tp_id" TEXT NOT NULL,
    "tp_access_token" TEXT NOT NULL,
    "tp_refresh_token" TEXT,
    "tp_customer_id" TEXT NOT NULL,
    "t_id" TEXT NOT NULL,
    "tp_account_url" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "connections_tp_customer_id_tp_id_key" ON "connections"("tp_customer_id", "tp_id");
