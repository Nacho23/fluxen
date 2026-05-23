"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import {
  createQuotationTemplate,
  deleteQuotationTemplate,
  getQuotationTemplateById,
  renameQuotationTemplate,
  saveQuotationTemplateLayout,
  setDefaultQuotationTemplate,
} from "@/lib/data/quotation-templates";
import {
  quotationTemplateLayoutSchema,
  defaultQuotationTemplateLayout,
  type QuotationTemplateLayout,
} from "@/lib/quotations/template-schema";

async function requireConfigUpdate() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.activeCompanyId) {
    throw new Error("No autorizado");
  }
  const ok = await sessionHasPermission(session, "configuracion", "update");
  if (!ok) {
    throw new Error("No tienes permiso para editar la configuración");
  }
  return { companyId: session.activeCompanyId };
}

function revalidateTemplatePages() {
  revalidatePath("/configuracion/cotizaciones-formato");
  revalidatePath("/cotizaciones");
}

// ---------------------------------------------------------------------------
// Leer template para el builder (client-side)
// ---------------------------------------------------------------------------

export async function getQuotationTemplateForBuilder(
  templateId: string,
): Promise<{ ok: true; layoutJson: string } | { ok: false; error: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.activeCompanyId) {
      return { ok: false, error: "No autorizado" };
    }
    const ok = await sessionHasPermission(session, "configuracion", "read");
    if (!ok) return { ok: false, error: "Sin permiso" };

    const row = await getQuotationTemplateById(templateId, session.activeCompanyId);
    if (!row) return { ok: false, error: "Formato no encontrado" };

    return { ok: true, layoutJson: JSON.stringify(row.layout) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al cargar";
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Guardar layout de un template existente
// ---------------------------------------------------------------------------

export async function saveQuotationTemplate(
  templateId: string,
  layoutJson: string,
): Promise<{ ok: true; updatedAt: string } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireConfigUpdate();

    let parsed: unknown;
    try {
      parsed = JSON.parse(layoutJson) as unknown;
    } catch {
      return { ok: false, error: "Formato inválido" };
    }

    const validated = quotationTemplateLayoutSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message ?? "Datos del formato no válidos",
      };
    }

    const row = await saveQuotationTemplateLayout(
      companyId,
      templateId,
      validated.data as QuotationTemplateLayout,
    );

    revalidateTemplatePages();
    return { ok: true, updatedAt: row.updatedAt.toISOString() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo guardar";
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Crear nuevo template
// ---------------------------------------------------------------------------

const createTemplateSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(60),
});

export async function createNewQuotationTemplate(
  name: string,
): Promise<{ ok: true; templateId: string } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireConfigUpdate();

    const v = createTemplateSchema.safeParse({ name });
    if (!v.success) {
      return { ok: false, error: v.error.issues[0]?.message ?? "Nombre inválido" };
    }

    const layout = defaultQuotationTemplateLayout();
    const row = await createQuotationTemplate(companyId, v.data.name, layout);

    revalidateTemplatePages();
    return { ok: true, templateId: row.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo crear el formato";
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Renombrar template
// ---------------------------------------------------------------------------

export async function renameTemplate(
  templateId: string,
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireConfigUpdate();

    const v = createTemplateSchema.safeParse({ name });
    if (!v.success) {
      return { ok: false, error: v.error.issues[0]?.message ?? "Nombre inválido" };
    }

    await renameQuotationTemplate(companyId, templateId, v.data.name);
    revalidateTemplatePages();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo renombrar";
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Marcar como predeterminado
// ---------------------------------------------------------------------------

export async function setDefaultTemplate(
  templateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireConfigUpdate();
    await setDefaultQuotationTemplate(companyId, templateId);
    revalidateTemplatePages();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo actualizar";
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Eliminar template
// ---------------------------------------------------------------------------

export async function deleteTemplate(
  templateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { companyId } = await requireConfigUpdate();
    const result = await deleteQuotationTemplate(companyId, templateId);
    if (!result.ok) return result;
    revalidateTemplatePages();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo eliminar";
    return { ok: false, error: msg };
  }
}
