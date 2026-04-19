-- CreateEnum
CREATE TYPE "ServiceItemType" AS ENUM ('SERVICIO', 'PRODUCTO');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN "itemType" "ServiceItemType";
