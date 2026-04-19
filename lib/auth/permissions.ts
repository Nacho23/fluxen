import type { Session } from "next-auth";
import { CompanyRole } from "@prisma/client";

/** Orden fijo en selects (no usar `Object.values(CompanyRole)` — puede variar entre entornos). */
export const ORDERED_COMPANY_ROLES: readonly CompanyRole[] = [
  CompanyRole.OWNER,
  CompanyRole.ADMIN,
  CompanyRole.OPS_ADMIN,
  CompanyRole.FIELD,
];

/** Etiquetas en UI (claves literales: evita huecos tras minify con `Record[enum]`). */
export const COMPANY_ROLE_LABEL: Record<CompanyRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  OPS_ADMIN: "Operador administrativo",
  FIELD: "Operador en terreno",
};

export function parseCompanyRole(value: string): CompanyRole | null {
  if (Object.values(CompanyRole).includes(value as CompanyRole)) {
    return value as CompanyRole;
  }
  return null;
}

export function getActiveCompanyRole(session: Session | null): CompanyRole | null {
  if (!session?.activeCompanyId) return null;
  const row = session.companies.find((c) => c.id === session.activeCompanyId);
  return row?.role ? parseCompanyRole(row.role) : null;
}

/** Crear empresas adicionales y editar datos de la empresa activa (configuración) */
export function canManageOrganizations(role: CompanyRole | null): boolean {
  return role === CompanyRole.OWNER;
}

/** Roles que un ADMIN puede asignar al invitar o editar */
export function rolesAssignableByAdmin(): CompanyRole[] {
  return [CompanyRole.OPS_ADMIN, CompanyRole.FIELD];
}
