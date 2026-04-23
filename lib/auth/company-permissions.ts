import { CompanyRole } from "@/lib/prisma/enums-public";
import { z } from "zod";

/** Módulos del panel alineados con rutas y menú. */
export const APP_RESOURCES = [
  "dashboard",
  "usuarios",
  "clientes",
  "servicios",
  "cotizaciones",
  "campos_cotizacion",
  "agenda",
  "ordenes",
  "pagos",
  "documentos",
  "configuracion",
  "notificaciones",
] as const;

export type AppResource = (typeof APP_RESOURCES)[number];

export type PermissionAction = "read" | "create" | "update" | "delete";

export type CrudFlags = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  /**
   * Solo aplica a `pagos` con `read`: si es `false`, el usuario solo ve pagos donde es trabajador
   * o quien los registró; si es `true`, ve todos los de la empresa.
   */
  readAll?: boolean;
};

/** Matriz por rol. OWNER no se persiste: siempre acceso total en runtime. */
export type CompanyPermissionsMatrix = Record<
  CompanyRole,
  Record<AppResource, CrudFlags>
>;

const cell = (r: boolean, c: boolean, u: boolean, d: boolean): CrudFlags => ({
  read: r,
  create: c,
  update: u,
  delete: d,
});

const Z = (): CrudFlags => cell(false, false, false, false);
const R = (): CrudFlags => cell(true, false, false, false);
const F = (): CrudFlags => cell(true, true, true, true);

function fullMatrixEveryResource(flags: CrudFlags): Record<AppResource, CrudFlags> {
  return Object.fromEntries(APP_RESOURCES.map((res) => [res, { ...flags }])) as Record<
    AppResource,
    CrudFlags
  >;
}

/**
 * Valores por defecto (equivalente al comportamiento histórico por rol).
 */
export function getDefaultPermissionMatrix(): CompanyPermissionsMatrix {
  return {
    [CompanyRole.OWNER]: fullMatrixEveryResource(F()),
    [CompanyRole.ADMIN]: {
      dashboard: R(),
      usuarios: F(),
      clientes: F(),
      servicios: F(),
      cotizaciones: F(),
      campos_cotizacion: F(),
      agenda: F(),
      ordenes: F(),
      pagos: { ...F(), readAll: true },
      documentos: F(),
      configuracion: R(),
      notificaciones: F(),
    },
    [CompanyRole.OPS_ADMIN]: {
      dashboard: R(),
      usuarios: Z(),
      clientes: F(),
      servicios: F(),
      cotizaciones: F(),
      campos_cotizacion: F(),
      agenda: F(),
      ordenes: F(),
      pagos: { ...F(), readAll: true },
      documentos: F(),
      configuracion: R(),
      notificaciones: R(),
    },
    [CompanyRole.FIELD]: {
      dashboard: R(),
      usuarios: Z(),
      clientes: R(),
      servicios: Z(),
      cotizaciones: Z(),
      campos_cotizacion: Z(),
      agenda: R(),
      ordenes: R(),
      pagos: { ...R(), readAll: false },
      documentos: R(),
      configuracion: Z(),
      notificaciones: Z(),
    },
  };
}

const resourceEnum = z.enum(APP_RESOURCES);

const crudSchema = z.object({
  read: z.boolean(),
  create: z.boolean(),
  update: z.boolean(),
  delete: z.boolean(),
  readAll: z.boolean().optional(),
});

const storedRolesSchema = z.object({
  ADMIN: z.record(resourceEnum, crudSchema).optional(),
  OPS_ADMIN: z.record(resourceEnum, crudSchema).optional(),
  FIELD: z.record(resourceEnum, crudSchema).optional(),
});

export function mergeMatrixWithDefaults(
  defaults: CompanyPermissionsMatrix,
  stored: unknown,
): CompanyPermissionsMatrix {
  const parsed = storedRolesSchema.safeParse(stored);
  if (!parsed.success) {
    return defaults;
  }
  const out = structuredClone(defaults);
  const roles: CompanyRole[] = [CompanyRole.ADMIN, CompanyRole.OPS_ADMIN, CompanyRole.FIELD];
  for (const role of roles) {
    const patch = parsed.data[role as keyof typeof parsed.data];
    if (!patch) continue;
    for (const res of APP_RESOURCES) {
      const c = patch[res];
      if (!c) continue;
      out[role][res] = { ...out[role][res], ...c };
    }
  }
  return out;
}

/** Clave en el snapshot JWT: ver todos los pagos de la empresa (vs. solo propios / registrados por mí). */
export const PAGOS_READ_ALL_KEY = "pagos:readAll" as const;

export function permissionKey(resource: AppResource, action: PermissionAction): string {
  return `${resource}:${action}`;
}

/**
 * Si el rol puede listar/ver todos los pagos. Sin `readAll` en datos antiguos: FIELD → solo propios;
 * el resto con `read` se asume listado completo (comportamiento previo).
 */
export function resolvePagosReadAll(flags: CrudFlags, role: CompanyRole): boolean {
  if (!flags.read) return false;
  if (typeof flags.readAll === "boolean") return flags.readAll;
  if (role === CompanyRole.FIELD) return false;
  return true;
}

export function roleHasPermission(
  matrix: CompanyPermissionsMatrix,
  role: CompanyRole,
  resource: AppResource,
  action: PermissionAction,
): boolean {
  if (role === CompanyRole.OWNER) {
    return true;
  }
  return matrix[role][resource][action] === true;
}

export function flattenRoleToSnapshot(
  matrix: CompanyPermissionsMatrix,
  role: CompanyRole,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const res of APP_RESOURCES) {
    for (const a of ["read", "create", "update", "delete"] as PermissionAction[]) {
      out[permissionKey(res, a)] = roleHasPermission(matrix, role, res, a);
    }
  }
  out[PAGOS_READ_ALL_KEY] =
    role === CompanyRole.OWNER
      ? true
      : resolvePagosReadAll(matrix[role].pagos, role);
  return out;
}

export function snapshotHasPermission(
  snapshot: Record<string, boolean> | undefined | null,
  resource: AppResource,
  action: PermissionAction,
): boolean {
  if (!snapshot) return false;
  return snapshot[permissionKey(resource, action)] === true;
}

export const editableRoles = [
  CompanyRole.ADMIN,
  CompanyRole.OPS_ADMIN,
  CompanyRole.FIELD,
] as const;

export type EditableCompanyRole = (typeof editableRoles)[number];

export const savePayloadSchema = z.object({
  ADMIN: z.record(resourceEnum, crudSchema),
  OPS_ADMIN: z.record(resourceEnum, crudSchema),
  FIELD: z.record(resourceEnum, crudSchema),
});

export type SaveablePermissionsPayload = z.infer<typeof savePayloadSchema>;

export const RESOURCE_LABEL: Record<AppResource, string> = {
  dashboard: "Panel",
  usuarios: "Usuarios",
  clientes: "Clientes",
  servicios: "Servicios",
  cotizaciones: "Cotizaciones",
  campos_cotizacion: "Campos personalizados (cotizaciones)",
  agenda: "Agenda",
  ordenes: "Órdenes",
  pagos: "Pagos",
  documentos: "Documentos",
  configuracion: "Configuración",
  notificaciones: "Notificaciones",
};

export const ACTION_LABEL: Record<PermissionAction, string> = {
  read: "Ver / listar",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
};
