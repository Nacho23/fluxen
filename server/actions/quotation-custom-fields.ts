"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { prisma } from "@/lib/db/prisma";

async function requireCamposCotizacionAction(action: "create" | "update" | "delete") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    throw new Error("No autorizado");
  }
  const ok = await sessionHasPermission(session, "campos_cotizacion", action);
  if (!ok) {
    throw new Error("No tienes permiso para gestionar campos de cotización");
  }
  return { session, companyId: session.activeCompanyId };
}

function formStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

const fieldTypeEnum = z.enum(["TEXT", "TEXTAREA", "NUMBER", "DATE"]);

const keySchema = z
  .string()
  .trim()
  .min(1, "Indica una clave interna")
  .max(60)
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Clave: empieza con letra minúscula; solo minúsculas, números y guión bajo",
  );

const createSchema = z.object({
  key: keySchema,
  label: z.string().trim().min(1, "Indica la etiqueta").max(120),
  fieldType: fieldTypeEnum,
  required: z.enum(["on", ""]),
});

export async function createQuotationCustomField(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireCamposCotizacionAction("create");

    const parsed = createSchema.safeParse({
      key: formStr(formData, "key"),
      label: formStr(formData, "label"),
      fieldType: formStr(formData, "fieldType"),
      required: formStr(formData, "required"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
    }

    const maxOrder = await prisma.quotationCustomField.aggregate({
      where: { companyId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;

    await prisma.quotationCustomField.create({
      data: {
        companyId,
        key: parsed.data.key,
        label: parsed.data.label,
        fieldType: parsed.data.fieldType,
        required: parsed.data.required === "on",
        sortOrder,
      },
    });

    revalidatePath("/cotizaciones/campos");
    revalidatePath("/cotizaciones/nueva");
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ya existe un campo con esa clave interna." };
    }
    const msg = e instanceof Error ? e.message : "Error al crear";
    return { ok: false, error: msg };
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(120),
  fieldType: fieldTypeEnum,
  required: z.enum(["on", ""]),
});

export async function updateQuotationCustomField(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireCamposCotizacionAction("update");

    const parsed = updateSchema.safeParse({
      id: formStr(formData, "id"),
      label: formStr(formData, "label"),
      fieldType: formStr(formData, "fieldType"),
      required: formStr(formData, "required"),
    });
    if (!parsed.success) {
      return { ok: false, error: "Datos no válidos" };
    }

    const row = await prisma.quotationCustomField.findFirst({
      where: { id: parsed.data.id, companyId },
    });
    if (!row) {
      return { ok: false, error: "Campo no encontrado" };
    }

    await prisma.quotationCustomField.update({
      where: { id: row.id },
      data: {
        label: parsed.data.label,
        fieldType: parsed.data.fieldType,
        required: parsed.data.required === "on",
      },
    });

    revalidatePath("/cotizaciones/campos");
    revalidatePath("/cotizaciones/nueva");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar";
    return { ok: false, error: msg };
  }
}

export async function deleteQuotationCustomField(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireCamposCotizacionAction("delete");

    const row = await prisma.quotationCustomField.findFirst({
      where: { id, companyId },
    });
    if (!row) {
      return { ok: false, error: "Campo no encontrado" };
    }

    await prisma.quotationCustomField.delete({ where: { id: row.id } });

    revalidatePath("/cotizaciones/campos");
    revalidatePath("/cotizaciones/nueva");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al eliminar";
    return { ok: false, error: msg };
  }
}
