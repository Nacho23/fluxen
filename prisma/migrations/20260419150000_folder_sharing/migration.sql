-- AlterTable: políticas por carpeta (histórico: autor = primer OWNER/ADMIN de la empresa)
ALTER TABLE "CompanyDocumentFolder" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "CompanyDocumentFolder" ADD COLUMN "othersCanView" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CompanyDocumentFolder" ADD COLUMN "othersCanEdit" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CompanyDocumentFolder" ADD COLUMN "othersCanDelete" BOOLEAN NOT NULL DEFAULT false;

UPDATE "CompanyDocumentFolder" f
SET "createdByUserId" = (
  SELECT m."userId" FROM "CompanyMember" m
  WHERE m."companyId" = f."companyId"
  ORDER BY m."createdAt" ASC
  LIMIT 1
)
WHERE "createdByUserId" IS NULL;

UPDATE "CompanyDocumentFolder" f
SET "createdByUserId" = (SELECT "id" FROM "User" LIMIT 1)
WHERE "createdByUserId" IS NULL;

ALTER TABLE "CompanyDocumentFolder" ALTER COLUMN "createdByUserId" SET NOT NULL;

ALTER TABLE "CompanyDocumentFolder" ADD CONSTRAINT "CompanyDocumentFolder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
