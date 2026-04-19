-- CreateTable
CREATE TABLE "CompanyDocumentFolder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDocumentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyDocumentFolder_companyId_idx" ON "CompanyDocumentFolder"("companyId");

-- CreateIndex
CREATE INDEX "CompanyDocumentFolder_companyId_parentId_idx" ON "CompanyDocumentFolder"("companyId", "parentId");

-- AddForeignKey
ALTER TABLE "CompanyDocumentFolder" ADD CONSTRAINT "CompanyDocumentFolder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocumentFolder" ADD CONSTRAINT "CompanyDocumentFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CompanyDocumentFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "CompanyDocument" ADD COLUMN "folderId" TEXT;

-- CreateIndex
CREATE INDEX "CompanyDocument_companyId_folderId_idx" ON "CompanyDocument"("companyId", "folderId");

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "CompanyDocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
