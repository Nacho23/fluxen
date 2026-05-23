-- Prisma creó la unicidad como UNIQUE INDEX, no como CONSTRAINT.
-- DROP CONSTRAINT no la eliminaba y impedía crear varios formatos por empresa.
DROP INDEX IF EXISTS "QuotationTemplate_companyId_key";
