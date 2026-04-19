-- Datos de perfil del usuario (RUT, contacto, banco). name pasa a NOT NULL con backfill.

ALTER TABLE "User"
  ADD COLUMN "rut" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "bankAccountType" TEXT,
  ADD COLUMN "bankAccountNumber" TEXT;

UPDATE "User"
SET "name" = COALESCE(NULLIF(TRIM("name"), ''), SPLIT_PART("email", '@', 1))
WHERE "name" IS NULL OR TRIM(COALESCE("name", '')) = '';

ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;
