-- Estilo del menú lateral e imágenes opcionales (portada / logo).
CREATE TYPE "SidebarPanelStyle" AS ENUM ('STANDARD', 'BRANDED');

ALTER TABLE "Company"
ADD COLUMN "sidebarPanelStyle" "SidebarPanelStyle" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "sidebarCoverUrl" TEXT,
ADD COLUMN "sidebarAvatarUrl" TEXT;
