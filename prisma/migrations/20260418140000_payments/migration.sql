-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CHECK', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_SIGNATURE', 'SIGNED');

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workerUserId" TEXT NOT NULL,
    "recordedByUserId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "serviceDate" TIMESTAMP(3),
    "activityDescription" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "tip" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "transactionCode" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING_SIGNATURE',
    "signedAt" TIMESTAMP(3),
    "signedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_companyId_idx" ON "Payment"("companyId");

-- CreateIndex
CREATE INDEX "Payment_workerUserId_idx" ON "Payment"("workerUserId");

-- CreateIndex
CREATE INDEX "Payment_companyId_status_idx" ON "Payment"("companyId", "status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_workerUserId_fkey" FOREIGN KEY ("workerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_signedByUserId_fkey" FOREIGN KEY ("signedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
