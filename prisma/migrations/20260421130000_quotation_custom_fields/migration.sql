-- CreateEnum
CREATE TYPE "QuotationCustomFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE');

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN "customFieldValues" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "QuotationCustomField" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "QuotationCustomFieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuotationCustomField_companyId_key_key" ON "QuotationCustomField"("companyId", "key");

-- CreateIndex
CREATE INDEX "QuotationCustomField_companyId_sortOrder_idx" ON "QuotationCustomField"("companyId", "sortOrder");

-- AddForeignKey
ALTER TABLE "QuotationCustomField" ADD CONSTRAINT "QuotationCustomField_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
