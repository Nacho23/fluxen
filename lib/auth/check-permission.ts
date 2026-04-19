import type { Session } from "next-auth";
import { CompanyRole } from "@prisma/client";
import { redirect } from "next/navigation";

import type { AppResource, PermissionAction } from "@/lib/auth/company-permissions";
import { roleHasPermission } from "@/lib/auth/company-permissions";
import { getMergedPermissionMatrix } from "@/lib/data/company-permission-matrix";
import { getActiveCompanyRole } from "@/lib/auth/permissions";

export async function sessionHasPermission(
  session: Session | null,
  resource: AppResource,
  action: PermissionAction,
): Promise<boolean> {
  if (!session?.activeCompanyId) return false;
  const role = getActiveCompanyRole(session);
  if (!role) return false;
  if (role === CompanyRole.OWNER) return true;
  const matrix = await getMergedPermissionMatrix(session.activeCompanyId);
  return roleHasPermission(matrix, role, resource, action);
}

export async function requirePermission(
  session: Session | null,
  resource: AppResource,
  action: PermissionAction,
): Promise<void> {
  const ok = await sessionHasPermission(session, resource, action);
  if (!ok) {
    redirect("/dashboard");
  }
}

/** Reglas que no son sustituibles por la matriz (p. ej. solo propietario crea empresas). */
export function requireCompanyOwner(session: Session | null): void {
  const role = getActiveCompanyRole(session);
  if (role !== CompanyRole.OWNER) {
    redirect("/dashboard");
  }
}
