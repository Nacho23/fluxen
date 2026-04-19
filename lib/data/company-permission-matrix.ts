import {
  getDefaultPermissionMatrix,
  mergeMatrixWithDefaults,
  type CompanyPermissionsMatrix,
} from "@/lib/auth/company-permissions";
import { prisma } from "@/lib/db/prisma";

export async function getMergedPermissionMatrix(
  companyId: string,
): Promise<CompanyPermissionsMatrix> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { rolePermissions: true },
  });
  const defaults = getDefaultPermissionMatrix();
  if (!company?.rolePermissions) {
    return defaults;
  }
  return mergeMatrixWithDefaults(defaults, company.rolePermissions);
}
