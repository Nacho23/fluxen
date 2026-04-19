"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import type { ServiceItemType } from "@/lib/data/service-item-type";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { prisma } from "@/lib/db/prisma";

async function requireServicioAction(action: "create" | "update" | "delete") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    throw new Error("No autorizado");
  }
  const ok = await sessionHasPermission(session, "servicios", action);
  if (!ok) {
    throw new Error("No tienes permiso para gestionar servicios");
  }
  return { session, companyId: session.activeCompanyId };
}

function formStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

const itemTypeField = z.enum(["", "SERVICIO", "PRODUCTO"]);

const createSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(120),
  description: z.string().max(2000),
  itemType: itemTypeField,
  defaultPrice: z.string(),
  unit: z.string().max(40),
});

function parsePrice(value: string | undefined): Prisma.Decimal | null {
  if (value == null || value === "") return null;
  const n = Number(value.replace(",", "."));
  if (Number.isNaN(n) || n < 0) {
    throw new Error("Precio no válido");
  }
  return new Prisma.Decimal(n.toFixed(2));
}

export async function createService(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireServicioAction("create");

    const parsed = createSchema.safeParse({
      name: formStr(formData, "name").trim(),
      description: formStr(formData, "description").trim(),
      itemType: formStr(formData, "itemType"),
      defaultPrice: formStr(formData, "defaultPrice").trim(),
      unit: formStr(formData, "unit").trim(),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const maxOrder = await prisma.service.aggregate({
      where: { companyId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;

    let price: Prisma.Decimal | null = null;
    try {
      price = parsePrice(parsed.data.defaultPrice || undefined);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Precio no válido" };
    }

    const desc = parsed.data.description;
    const unt = parsed.data.unit;
    const itemType: ServiceItemType | null =
      parsed.data.itemType === "" ? null : parsed.data.itemType;

    await prisma.service.create({
      data: {
        companyId,
        name: parsed.data.name,
        description: desc.length > 0 ? desc : null,
        itemType,
        defaultPrice: price,
        unit: unt.length > 0 ? unt : null,
        sortOrder,
      },
    });

    revalidatePath("/servicios");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear";
    return { ok: false, error: msg };
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(2000),
  itemType: itemTypeField,
  defaultPrice: z.string(),
  unit: z.string().max(40),
  active: z.enum(["true", "false"]),
});

export async function updateService(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireServicioAction("update");

    const parsed = updateSchema.safeParse({
      id: formStr(formData, "id"),
      name: formStr(formData, "name").trim(),
      description: formStr(formData, "description").trim(),
      itemType: formStr(formData, "itemType"),
      defaultPrice: formStr(formData, "defaultPrice").trim(),
      unit: formStr(formData, "unit").trim(),
      active: formStr(formData, "active"),
    });
    if (!parsed.success) {
      return { ok: false, error: "Datos no válidos" };
    }

    const row = await prisma.service.findFirst({
      where: { id: parsed.data.id, companyId },
    });
    if (!row) {
      return { ok: false, error: "Servicio no encontrado" };
    }

    let price: Prisma.Decimal | null = null;
    try {
      price = parsePrice(parsed.data.defaultPrice || undefined);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Precio no válido" };
    }

    const uDesc = parsed.data.description;
    const uUnit = parsed.data.unit;
    const uItemType: ServiceItemType | null =
      parsed.data.itemType === "" ? null : parsed.data.itemType;

    await prisma.service.update({
      where: { id: row.id },
      data: {
        name: parsed.data.name,
        description: uDesc.length > 0 ? uDesc : null,
        itemType: uItemType,
        defaultPrice: price,
        unit: uUnit.length > 0 ? uUnit : null,
        active: parsed.data.active === "true",
      },
    });

    revalidatePath("/servicios");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar";
    return { ok: false, error: msg };
  }
}

export async function deleteService(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireServicioAction("delete");

    const row = await prisma.service.findFirst({
      where: { id, companyId },
    });
    if (!row) {
      return { ok: false, error: "Servicio no encontrado" };
    }

    await prisma.service.delete({ where: { id: row.id } });

    revalidatePath("/servicios");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar";
    return { ok: false, error: msg };
  }
}
