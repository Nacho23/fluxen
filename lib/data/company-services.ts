import { prisma } from "@/lib/db/prisma";
import type { ServiceItemType } from "@/lib/data/service-item-type";

export type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  itemType: ServiceItemType | null;
  defaultPrice: string | null;
  unit: string | null;
  sortOrder: number;
  active: boolean;
};

export async function getActiveServicesForCompany(companyId: string): Promise<ServiceRow[]> {
  const rows = await prisma.service.findMany({
    where: { companyId, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    itemType: s.itemType,
    defaultPrice: s.defaultPrice?.toString() ?? null,
    unit: s.unit,
    sortOrder: s.sortOrder,
    active: s.active,
  }));
}

export async function getServicesForCompany(companyId: string): Promise<ServiceRow[]> {
  const rows = await prisma.service.findMany({
    where: { companyId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    itemType: s.itemType,
    defaultPrice: s.defaultPrice?.toString() ?? null,
    unit: s.unit,
    sortOrder: s.sortOrder,
    active: s.active,
  }));
}
