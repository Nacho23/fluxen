-- Migración: múltiples templates por empresa + templateId en Quotation

-- 1. Eliminar unicidad en companyId (índice UNIQUE de Prisma, no solo CONSTRAINT)
DROP INDEX IF EXISTS "QuotationTemplate_companyId_key";
ALTER TABLE "QuotationTemplate" DROP CONSTRAINT IF EXISTS "QuotationTemplate_companyId_key";

-- 2. Agregar columnas name e isDefault
ALTER TABLE "QuotationTemplate" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT 'Formato principal';
ALTER TABLE "QuotationTemplate" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- 3. Marcar todos los templates existentes como predeterminados (había uno por empresa)
UPDATE "QuotationTemplate" SET "isDefault" = true;

-- 4. Índices en QuotationTemplate
CREATE INDEX IF NOT EXISTS "QuotationTemplate_companyId_idx" ON "QuotationTemplate"("companyId");
CREATE INDEX IF NOT EXISTS "QuotationTemplate_companyId_isDefault_idx" ON "QuotationTemplate"("companyId", "isDefault");

-- 5. Agregar templateId a Quotation
ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "templateId" TEXT;

-- 6. Foreign key de Quotation.templateId → QuotationTemplate.id
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "QuotationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Índice en Quotation.templateId
CREATE INDEX IF NOT EXISTS "Quotation_templateId_idx" ON "Quotation"("templateId");
