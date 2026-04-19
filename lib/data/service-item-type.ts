export const SERVICE_ITEM_TYPE_LABEL = {
  SERVICIO: "Servicio",
  PRODUCTO: "Producto",
} as const;

/** Valores del enum `ServiceItemType` en Prisma (evita importar el tipo desde `@prisma/client`, donde choca con el const homónimo). */
export type ServiceItemType = keyof typeof SERVICE_ITEM_TYPE_LABEL;
