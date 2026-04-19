-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuoteDiscountMode" AS ENUM ('NONE', 'PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "quoteCodePrefix" TEXT NOT NULL DEFAULT 'COT';
ALTER TABLE "Company" ADD COLUMN "quoteCodePadding" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Company" ADD COLUMN "lastQuoteSequence" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT,
    "discountMode" "QuoteDiscountMode" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(12,2),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationLine" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "itemType" "ServiceItemType",
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuotationLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_companyId_quoteNumber_key" ON "Quotation"("companyId", "quoteNumber");

-- CreateIndex
CREATE INDEX "Quotation_companyId_idx" ON "Quotation"("companyId");

-- CreateIndex
CREATE INDEX "QuotationLine_quotationId_idx" ON "QuotationLine"("quotationId");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationLine" ADD CONSTRAINT "QuotationLine_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationLine" ADD CONSTRAINT "QuotationLine_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
