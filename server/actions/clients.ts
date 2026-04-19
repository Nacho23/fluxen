"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { ClientKind } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import type { ClientRow } from "@/lib/data/company-clients";
import { prisma } from "@/lib/db/prisma";
import { isValidChileRut, normalizeRutInput } from "@/lib/validation/chile-rut";

async function requireClienteAction(action: "create" | "update" | "delete") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    throw new Error("No autorizado");
  }
  const ok = await sessionHasPermission(session, "clientes", action);
  if (!ok) {
    throw new Error("No tienes permiso para gestionar clientes");
  }
  return { session, companyId: session.activeCompanyId };
}

function serializeClient(row: {
  id: string;
  kind: ClientKind;
  name: string;
  email: string | null;
  phone: string | null;
  rut: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ClientRow {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    email: row.email,
    phone: row.phone,
    rut: row.rut,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const kindSchema = z.nativeEnum(ClientKind);

/** Vacío o ausente → null; si hay texto debe ser correo válido. */
const optionalClientEmail = z.preprocess(
  (v: unknown) => (v === null || v === undefined ? "" : v),
  z.string().max(255),
)
  .transform((s) => s.trim())
  .transform((s) => (s === "" ? null : s))
  .pipe(z.union([z.null(), z.string().email("Correo no válido")]));

const baseFields = {
  kind: kindSchema,
  name: z.string().trim().min(1, "Nombre requerido").max(200),
  email: optionalClientEmail,
  phone: z.string().trim().max(50).optional().nullable(),
  rut: z.string().trim().max(20).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
};

const createSchema = z.object(baseFields);

const updateSchema = z.object({
  id: z.string().min(1),
  ...baseFields,
});

function parseRut(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") return null;
  if (!isValidChileRut(value)) {
    throw new Error("RUT no válido");
  }
  return normalizeRutInput(value);
}

export async function createCompanyClient(
  input: unknown,
): Promise<{ ok: true; client: ClientRow } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireClienteAction("create");
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    let rutStored: string | null;
    try {
      rutStored = parseRut(parsed.data.rut ?? null);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "RUT no válido" };
    }

    const phone = parsed.data.phone?.trim() || null;
    const notes = parsed.data.notes?.trim() || null;

    const row = await prisma.companyClient.create({
      data: {
        companyId,
        kind: parsed.data.kind,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: phone || null,
        rut: rutStored,
        notes,
      },
    });

    revalidatePath("/clientes");
    revalidatePath("/cotizaciones/nueva");
    return { ok: true, client: serializeClient(row) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear el cliente";
    return { ok: false, error: msg };
  }
}

export async function updateCompanyClient(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireClienteAction("update");
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const existing = await prisma.companyClient.findFirst({
      where: { id: parsed.data.id, companyId },
    });
    if (!existing) {
      return { ok: false, error: "Cliente no encontrado" };
    }

    let rutStored: string | null;
    try {
      rutStored = parseRut(parsed.data.rut ?? null);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "RUT no válido" };
    }

    const phone = parsed.data.phone?.trim() || null;
    const notes = parsed.data.notes?.trim() || null;

    await prisma.companyClient.update({
      where: { id: existing.id },
      data: {
        kind: parsed.data.kind,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: phone || null,
        rut: rutStored,
        notes,
      },
    });

    revalidatePath("/clientes");
    revalidatePath("/cotizaciones/nueva");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar";
    return { ok: false, error: msg };
  }
}

export async function deleteCompanyClient(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireClienteAction("delete");

    const existing = await prisma.companyClient.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, error: "Cliente no encontrado" };
    }

    const quoteCount = await prisma.quotation.count({
      where: { clientId: existing.id },
    });
    if (quoteCount > 0) {
      return {
        ok: false,
        error: "No se puede eliminar: hay cotizaciones vinculadas a este cliente.",
      };
    }

    await prisma.companyClient.delete({ where: { id: existing.id } });

    revalidatePath("/clientes");
    revalidatePath("/cotizaciones/nueva");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar";
    return { ok: false, error: msg };
  }
}
