-- CreateEnum
CREATE TYPE "ClientKind" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateTable
CREATE TABLE "CompanyClient" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" "ClientKind" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "rut" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyClient_companyId_idx" ON "CompanyClient"("companyId");

-- CreateIndex
CREATE INDEX "CompanyClient_companyId_name_idx" ON "CompanyClient"("companyId", "name");

-- AddForeignKey
ALTER TABLE "CompanyClient" ADD CONSTRAINT "CompanyClient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN "clientId" TEXT;

-- CreateIndex
CREATE INDEX "Quotation_clientId_idx" ON "Quotation"("clientId");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CompanyClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
