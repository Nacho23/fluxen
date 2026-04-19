-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "title" TEXT,
    "originalFilename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "othersCanView" BOOLEAN NOT NULL DEFAULT true,
    "othersCanEdit" BOOLEAN NOT NULL DEFAULT true,
    "othersCanDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyDocument_storageKey_key" ON "CompanyDocument"("storageKey");

-- CreateIndex
CREATE INDEX "CompanyDocument_companyId_idx" ON "CompanyDocument"("companyId");

-- CreateIndex
CREATE INDEX "CompanyDocument_companyId_uploadedByUserId_idx" ON "CompanyDocument"("companyId", "uploadedByUserId");

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
