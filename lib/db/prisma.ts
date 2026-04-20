import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { parseAndValidatePostgresUrl } from "@/lib/db/validate-database-url";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL no está definida");
  }
  const connectionString = parseAndValidatePostgresUrl(raw);
  const adapter = new PrismaPg(connectionString);
  return new PrismaClient({ adapter });
}

/**
 * Tras `prisma generate` o cambios de schema, un PrismaClient viejo en `globalThis`
 * puede seguir sin delegados nuevos (p. ej. `quotation`). Esto evita reutilizarlo.
 */
function clientHasExpectedModels(client: PrismaClient): boolean {
  const c = client as unknown as {
    service?: { findMany?: unknown };
    quotation?: { findMany?: unknown };
    quotationLine?: { findMany?: unknown };
    payment?: { findMany?: unknown };
  };
  return (
    typeof c.service?.findMany === "function" &&
    typeof c.quotation?.findMany === "function" &&
    typeof c.quotationLine?.findMany === "function" &&
    typeof c.payment?.findMany === "function"
  );
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (existing && clientHasExpectedModels(existing)) {
    return existing;
  }
  const client = createClient();
  globalForPrisma.prisma = client;
  return client;
}

/**
 * Proxy: en dev/hot-reload el módulo puede quedar cacheado con un cliente antiguo;
 * cada acceso pasa por `getPrismaClient()` y se reemplaza si faltan modelos.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
}) as PrismaClient;
