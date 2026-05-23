import { prisma } from "@/lib/db/prisma";
import {
  defaultQuotationTemplateLayout,
  parseQuotationTemplateLayout,
  type QuotationTemplateLayout,
} from "@/lib/quotations/template-schema";

export type QuotationTemplateRow = {
  id: string;
  companyId: string;
  name: string;
  isDefault: boolean;
  layout: QuotationTemplateLayout;
  updatedAt: Date;
};

export type QuotationTemplateSummary = {
  id: string;
  name: string;
  isDefault: boolean;
  updatedAt: Date;
};

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

export async function listQuotationTemplatesForCompany(
  companyId: string,
): Promise<QuotationTemplateSummary[]> {
  const rows = await prisma.quotationTemplate.findMany({
    where: { companyId },
    select: { id: true, name: true, isDefault: true, updatedAt: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return rows;
}

/** Lista formatos; si la empresa no tiene ninguno, crea el predeterminado. */
export async function listQuotationTemplatesForQuotationForm(
  companyId: string,
): Promise<QuotationTemplateSummary[]> {
  const rows = await listQuotationTemplatesForCompany(companyId);
  if (rows.length > 0) return rows;
  const created = await getOrCreateDefaultQuotationTemplate(companyId);
  return [
    {
      id: created.id,
      name: created.name,
      isDefault: created.isDefault,
      updatedAt: created.updatedAt,
    },
  ];
}

export async function getQuotationTemplateById(
  id: string,
  companyId: string,
): Promise<QuotationTemplateRow | null> {
  const row = await prisma.quotationTemplate.findFirst({
    where: { id, companyId },
  });
  if (!row) return null;
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.name,
    isDefault: row.isDefault,
    layout: parseQuotationTemplateLayout(row.layout),
    updatedAt: row.updatedAt,
  };
}

/** Devuelve el layout del template predeterminado (o el default de código si no existe ninguno). */
export async function getDefaultTemplateLayoutForCompany(
  companyId: string,
): Promise<QuotationTemplateLayout> {
  const row = await prisma.quotationTemplate.findFirst({
    where: { companyId, isDefault: true },
    select: { layout: true },
  });
  if (row) return parseQuotationTemplateLayout(row.layout);

  // Fallback: cualquier template de la empresa
  const any = await prisma.quotationTemplate.findFirst({
    where: { companyId },
    select: { layout: true },
    orderBy: { createdAt: "asc" },
  });
  if (any) return parseQuotationTemplateLayout(any.layout);

  return defaultQuotationTemplateLayout();
}

/**
 * Devuelve el layout del template especificado.
 * Si `templateId` es null/undefined, devuelve el predeterminado.
 */
export async function getQuotationTemplateLayoutForCompany(
  companyId: string,
  templateId?: string | null,
): Promise<QuotationTemplateLayout> {
  if (templateId) {
    const row = await prisma.quotationTemplate.findFirst({
      where: { id: templateId, companyId },
      select: { layout: true },
    });
    if (row) return parseQuotationTemplateLayout(row.layout);
  }
  return getDefaultTemplateLayoutForCompany(companyId);
}

/** Crea o devuelve el template predeterminado de la empresa (usado en configuración). */
export async function getOrCreateDefaultQuotationTemplate(
  companyId: string,
): Promise<QuotationTemplateRow> {
  const existing = await prisma.quotationTemplate.findFirst({
    where: { companyId, isDefault: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) {
    return {
      id: existing.id,
      companyId: existing.companyId,
      name: existing.name,
      isDefault: existing.isDefault,
      layout: parseQuotationTemplateLayout(existing.layout),
      updatedAt: existing.updatedAt,
    };
  }

  // Ningún template existe todavía → crear el primero como default
  const layout = defaultQuotationTemplateLayout();
  const created = await prisma.quotationTemplate.create({
    data: {
      companyId,
      name: "Formato principal",
      isDefault: true,
      layout: layout as object,
    },
  });
  return {
    id: created.id,
    companyId: created.companyId,
    name: created.name,
    isDefault: created.isDefault,
    layout,
    updatedAt: created.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

export async function createQuotationTemplate(
  companyId: string,
  name: string,
  layout: QuotationTemplateLayout,
): Promise<QuotationTemplateRow> {
  const count = await prisma.quotationTemplate.count({ where: { companyId } });
  const row = await prisma.quotationTemplate.create({
    data: {
      companyId,
      name,
      isDefault: count === 0,
      layout: layout as object,
    },
  });
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.name,
    isDefault: row.isDefault,
    layout,
    updatedAt: row.updatedAt,
  };
}

export async function saveQuotationTemplateLayout(
  companyId: string,
  templateId: string,
  layout: QuotationTemplateLayout,
): Promise<QuotationTemplateRow> {
  const row = await prisma.quotationTemplate.update({
    where: { id: templateId, companyId },
    data: { layout: layout as object },
  });
  return {
    id: row.id,
    companyId: row.companyId,
    name: row.name,
    isDefault: row.isDefault,
    layout,
    updatedAt: row.updatedAt,
  };
}

export async function renameQuotationTemplate(
  companyId: string,
  templateId: string,
  name: string,
): Promise<void> {
  await prisma.quotationTemplate.update({
    where: { id: templateId, companyId },
    data: { name },
  });
}

/** Marca un template como predeterminado y quita el flag de los demás. */
export async function setDefaultQuotationTemplate(
  companyId: string,
  templateId: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.quotationTemplate.updateMany({
      where: { companyId },
      data: { isDefault: false },
    }),
    prisma.quotationTemplate.update({
      where: { id: templateId, companyId },
      data: { isDefault: true },
    }),
  ]);
}

/**
 * Elimina un template. No permite eliminar el predeterminado si es el único.
 * Si se elimina el predeterminado, promueve el siguiente más antiguo.
 */
export async function deleteQuotationTemplate(
  companyId: string,
  templateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const target = await prisma.quotationTemplate.findFirst({
    where: { id: templateId, companyId },
    select: { isDefault: true },
  });
  if (!target) return { ok: false, error: "Formato no encontrado" };

  const total = await prisma.quotationTemplate.count({ where: { companyId } });
  if (total <= 1) return { ok: false, error: "No puedes eliminar el único formato disponible" };

  await prisma.quotationTemplate.delete({ where: { id: templateId } });

  if (target.isDefault) {
    // Promover el template más antiguo restante como nuevo default
    const next = await prisma.quotationTemplate.findFirst({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.quotationTemplate.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  return { ok: true };
}
