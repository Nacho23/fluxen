-- Campos opcionales de ficha de empresa (configuración).
ALTER TABLE "Company" ADD COLUMN "address" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "legalRepresentative" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "rut" TEXT,
ADD COLUMN "businessName" TEXT;
