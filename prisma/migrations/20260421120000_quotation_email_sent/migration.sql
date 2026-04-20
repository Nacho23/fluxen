-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN "emailSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Quotation" ADD COLUMN "emailSentAt" TIMESTAMP(3);
