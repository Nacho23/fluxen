-- AlterTable
ALTER TABLE "CompanyClient" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Quotation" ALTER COLUMN "clientEmail" DROP NOT NULL;
