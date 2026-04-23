-- Imágenes de marca (portada / avatar) subidas a R2; clave del objeto en el bucket.
ALTER TABLE "Company"
ADD COLUMN "sidebarCoverStorageKey" TEXT,
ADD COLUMN "sidebarAvatarStorageKey" TEXT;
