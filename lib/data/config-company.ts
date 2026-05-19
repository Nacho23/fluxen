import { CompanyRole } from "@/lib/prisma/enums-public";
import { prisma } from "@/lib/db/prisma";

const ownerConfigSelect = {
  name: true,
  slug: true,
  quoteCodePrefix: true,
  quoteCodePadding: true,
  workOrderCodePrefix: true,
  workOrderCodePadding: true,
  address: true,
  phone: true,
  legalRepresentative: true,
  email: true,
  website: true,
  city: true,
  country: true,
  rut: true,
  businessName: true,
  sidebarPanelStyle: true,
  sidebarCoverUrl: true,
  sidebarAvatarUrl: true,
  sidebarCoverStorageKey: true,
  sidebarAvatarStorageKey: true,
} as const;

export type OwnerCompanyConfig = NonNullable<
  Awaited<ReturnType<typeof getActiveCompanyForOwnerConfig>>
>;

export async function getActiveCompanyForOwnerConfig(
  activeId: string | null | undefined,
  role: CompanyRole | null,
) {
  if (!activeId || role !== CompanyRole.OWNER) {
    return null;
  }
  return prisma.company.findUnique({
    where: { id: activeId },
    select: ownerConfigSelect,
  });
}
