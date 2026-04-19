import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Calendar,
  ClipboardList,
  Contact,
  FileText,
  Files,
  Layers,
  LayoutDashboard,
  Settings,
  UserCog,
} from "lucide-react";
import { CompanyRole } from "@prisma/client";

import type { AppResource } from "@/lib/auth/company-permissions";
import { snapshotHasPermission } from "@/lib/auth/company-permissions";

const ALL_ROLES: CompanyRole[] = [
  CompanyRole.OWNER,
  CompanyRole.ADMIN,
  CompanyRole.OPS_ADMIN,
  CompanyRole.FIELD,
];

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles que históricamente podían ver el ítem (fallback si la sesión no trae `permissions`). */
  roles: CompanyRole[];
  /** Módulo usado con la matriz de permisos (lectura para mostrar en el menú). */
  resource: AppResource;
};

export const APP_NAV: AppNavItem[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard, roles: ALL_ROLES, resource: "dashboard" },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: UserCog,
    roles: [CompanyRole.OWNER, CompanyRole.ADMIN, CompanyRole.OPS_ADMIN],
    resource: "usuarios",
  },
  { href: "/clientes", label: "Clientes", icon: Contact, roles: ALL_ROLES, resource: "clientes" },
  {
    href: "/servicios",
    label: "Servicios",
    icon: Layers,
    roles: [CompanyRole.OWNER, CompanyRole.ADMIN, CompanyRole.OPS_ADMIN],
    resource: "servicios",
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    icon: FileText,
    roles: [CompanyRole.OWNER, CompanyRole.ADMIN, CompanyRole.OPS_ADMIN],
    resource: "cotizaciones",
  },
  { href: "/agenda", label: "Agenda", icon: Calendar, roles: ALL_ROLES, resource: "agenda" },
  { href: "/ordenes", label: "Órdenes", icon: ClipboardList, roles: ALL_ROLES, resource: "ordenes" },
  {
    href: "/pagos",
    label: "Pagos",
    icon: Banknote,
    roles: ALL_ROLES,
    resource: "pagos",
  },
  {
    href: "/documentos",
    label: "Documentos",
    icon: Files,
    roles: ALL_ROLES,
    resource: "documentos",
  },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: Settings,
    roles: [CompanyRole.OWNER, CompanyRole.ADMIN, CompanyRole.OPS_ADMIN],
    resource: "configuracion",
  },
];

export function navItemsForSession(
  hasCompanies: boolean,
  role: CompanyRole | null,
  permissions?: Record<string, boolean> | null,
): AppNavItem[] {
  if (!hasCompanies) {
    return APP_NAV.filter((item) => item.href === "/dashboard");
  }
  if (!role) {
    return APP_NAV.filter((item) => item.href === "/dashboard");
  }

  const hasSnapshot =
    permissions != null && typeof permissions === "object" && Object.keys(permissions).length > 0;

  if (hasSnapshot) {
    return APP_NAV.filter((item) => snapshotHasPermission(permissions, item.resource, "read"));
  }

  return APP_NAV.filter((item) => item.roles.includes(role));
}
