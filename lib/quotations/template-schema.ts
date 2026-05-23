import { z } from "zod";

export const QUOTATION_TEMPLATE_VERSION = 1 as const;

export const QUOTATION_TEMPLATE_BLOCK_IDS = [
  "company",
  "quote_meta",
  "client",
  "custom_fields",
  "lines",
  "totals",
  "terms",
  "signature",
  "footer",
] as const;

export type QuotationTemplateBlockId = (typeof QUOTATION_TEMPLATE_BLOCK_IDS)[number];

export const QUOTATION_TEMPLATE_BLOCK_LABELS: Record<QuotationTemplateBlockId, string> = {
  company: "Datos de la empresa",
  quote_meta: "Número y fecha",
  client: "Cliente",
  custom_fields: "Campos personalizados",
  lines: "Tabla de ítems",
  totals: "Totales",
  terms: "Términos y condiciones",
  signature: "Firma",
  footer: "Pie de página",
};

/** id para secciones personalizadas de texto libre */
export function makeCustomSectionId(): string {
  return `custom_${Date.now().toString(36)}`;
}

export function isCustomSectionId(id: string): boolean {
  return id.startsWith("custom_");
}

// Bloques: id puede ser un bloque fijo o un id de sección personalizada
const blockSchema = z.object({
  id: z.string().min(1).max(80),
  enabled: z.boolean(),
});

export const ALIGN_OPTIONS = ["left", "center", "right"] as const;
export type TextAlign = (typeof ALIGN_OPTIONS)[number];

const alignSchema = z.enum(ALIGN_OPTIONS);

export const BODY_ALIGN_OPTIONS = ["left", "center", "right", "justify"] as const;
export type BodyTextAlign = (typeof BODY_ALIGN_OPTIONS)[number];

const bodyAlignSchema = z.enum(BODY_ALIGN_OPTIONS);

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido")
  .transform((s) => s.toLowerCase());

const signatureRowSchema = z.object({
  text: z.string().trim().max(200),
  size: z.number().int().min(7).max(28),
  bold: z.boolean(),
  italic: z.boolean(),
});

export type SignatureRow = z.infer<typeof signatureRowSchema>;

const customSectionFieldRefSchema = z.object({
  id: z.string().min(1).max(80),
  fieldId: z.string().min(1).max(80),
  align: bodyAlignSchema,
  size: z.number().int().min(7).max(20),
  bold: z.boolean(),
});

export type CustomSectionFieldRef = z.infer<typeof customSectionFieldRefSchema>;

const customSectionSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().min(1, "El título no puede estar vacío").max(60),
  body: z.string().trim().max(3000),
  bodyAlign: bodyAlignSchema,
  bodySize: z.number().int().min(7).max(20),
  bodyBold: z.boolean(),
  fieldRefs: z.array(customSectionFieldRefSchema),
});

export type QuotationCustomSection = z.infer<typeof customSectionSchema>;

export const quotationTemplateLayoutSchema = z.object({
  version: z.literal(QUOTATION_TEMPLATE_VERSION),
  accentColor: hexColorSchema,
  documentTitle: z.string().trim().max(80),
  blocks: z.array(blockSchema),
  quoteMeta: z.object({
    titleAlign: alignSchema,
    titleSize: z.number().int().min(10).max(40),
    titleBold: z.boolean(),
    subtitleAlign: alignSchema,
    subtitleSize: z.number().int().min(8).max(32),
    subtitleBold: z.boolean(),
  }),
  company: z.object({
    showLogo: z.boolean(),
    showName: z.boolean(),
    showBusinessName: z.boolean(),
    showRut: z.boolean(),
    showAddress: z.boolean(),
    showPhone: z.boolean(),
    showEmail: z.boolean(),
    showWebsite: z.boolean(),
    showCityCountry: z.boolean(),
  }),
  client: z.object({
    sectionTitle: z.string().trim().min(1, "El título de sección «Cliente» no puede estar vacío").max(60),
    showName: z.boolean(),
    showEmail: z.boolean(),
    showPhone: z.boolean(),
    showServiceDate: z.boolean(),
    showNotes: z.boolean(),
    labelName: z.string().trim().max(40),
    labelEmail: z.string().trim().max(40),
    labelPhone: z.string().trim().max(40),
    labelServiceDate: z.string().trim().max(40),
    labelNotes: z.string().trim().max(40),
    showLabelName: z.boolean(),
    showLabelEmail: z.boolean(),
    showLabelPhone: z.boolean(),
    showLabelServiceDate: z.boolean(),
    showLabelNotes: z.boolean(),
  }),
  customFields: z.object({
    sectionTitle: z.string().trim().min(1, "El título de sección «Campos adicionales» no puede estar vacío").max(60),
  }),
  lines: z.object({
    sectionTitle: z.string().trim().min(1, "El título de la tabla de ítems no puede estar vacío").max(60),
    showTypeColumn: z.boolean(),
    labelDescription: z.string().trim().min(1, "La etiqueta «Descripción» no puede estar vacía").max(30),
    labelType: z.string().trim().min(1, "La etiqueta «Tipo» no puede estar vacía").max(30),
    labelQuantity: z.string().trim().min(1, "La etiqueta «Cantidad» no puede estar vacía").max(30),
    labelUnitPrice: z.string().trim().min(1, "La etiqueta «Precio unit.» no puede estar vacía").max(30),
    labelLineTotal: z.string().trim().min(1, "La etiqueta «Total» no puede estar vacía").max(30),
  }),
  totals: z.object({
    labelSubtotal: z.string().trim().min(1, "La etiqueta «Subtotal» no puede estar vacía").max(30),
    labelDiscount: z.string().trim().min(1, "La etiqueta «Descuento» no puede estar vacía").max(30),
    labelVat: z.string().trim().min(1, "La etiqueta «IVA» no puede estar vacía").max(40),
    labelVatIncluded: z.string().trim().min(1, "La nota de IVA incluido no puede estar vacía").max(60),
    labelTotal: z.string().trim().min(1, "La etiqueta «Total» no puede estar vacía").max(30),
  }),
  terms: z.object({
    sectionTitle: z.string().trim().min(1, "El título de sección «Términos» no puede estar vacío").max(60),
    body: z.string().trim().max(3000),
  }),
  signature: z.object({
    align: alignSchema,
    rows: z.array(signatureRowSchema),
  }),
  footer: z.object({
    showBody: z.boolean(),
    body: z.string().trim().max(500),
    showPageNumber: z.boolean(),
    distribution: z.enum(["center", "justify"]),
  }),
  customSections: z.array(customSectionSchema),
});

export type QuotationTemplateLayout = z.infer<typeof quotationTemplateLayoutSchema>;

export function defaultQuotationTemplateLayout(): QuotationTemplateLayout {
  return {
    version: QUOTATION_TEMPLATE_VERSION,
    accentColor: "#0f172a",
    documentTitle: "Cotización",
    blocks: QUOTATION_TEMPLATE_BLOCK_IDS.map((id) => ({
      id,
      enabled: id !== "terms" && id !== "signature",
    })),
    quoteMeta: {
      titleAlign: "left",
      titleSize: 18,
      titleBold: true,
      subtitleAlign: "left",
      subtitleSize: 12,
      subtitleBold: false,
    },
    company: {
      showLogo: true,
      showName: true,
      showBusinessName: true,
      showRut: true,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showWebsite: false,
      showCityCountry: true,
    },
    client: {
      sectionTitle: "Cliente",
      showName: true,
      showEmail: true,
      showPhone: true,
      showServiceDate: true,
      showNotes: false,
      labelName: "Nombre / empresa",
      labelEmail: "Correo",
      labelPhone: "Teléfono",
      labelServiceDate: "Fecha del servicio",
      labelNotes: "Notas adicionales",
      showLabelName: true,
      showLabelEmail: true,
      showLabelPhone: true,
      showLabelServiceDate: true,
      showLabelNotes: true,
    },
    customFields: {
      sectionTitle: "Información adicional",
    },
    lines: {
      sectionTitle: "Detalle",
      showTypeColumn: true,
      labelDescription: "Descripción",
      labelType: "Tipo",
      labelQuantity: "Cant.",
      labelUnitPrice: "P. unit.",
      labelLineTotal: "Total",
    },
    totals: {
      labelSubtotal: "Subtotal",
      labelDiscount: "Descuento",
      labelVat: "IVA (19%)",
      labelVatIncluded: "IVA (19%) incluido en el total",
      labelTotal: "Total",
    },
    terms: {
      sectionTitle: "Términos y condiciones",
      body: "",
    },
    signature: {
      align: "left",
      rows: [
        { text: "____________________", size: 10, bold: false, italic: false },
        { text: "", size: 10, bold: false, italic: false },
        { text: "Cargo / empresa", size: 9, bold: false, italic: true },
      ],
    },
    footer: {
      showBody: true,
      body: "Documento generado electrónicamente",
      showPageNumber: false,
      distribution: "center",
    },
    customSections: [],
  };
}

/** Dedup y garantiza que todos los bloques fijos estén presentes. Preserva custom. */
export function normalizeQuotationTemplateBlocks(
  blocks: QuotationTemplateLayout["blocks"],
  customSections: QuotationCustomSection[],
): QuotationTemplateLayout["blocks"] {
  const seen = new Set<string>();
  const result: QuotationTemplateLayout["blocks"] = [];

  for (const block of blocks) {
    if (!seen.has(block.id)) {
      seen.add(block.id);
      result.push(block);
    }
  }

  for (const id of QUOTATION_TEMPLATE_BLOCK_IDS) {
    if (!seen.has(id)) {
      result.push({ id, enabled: false });
    }
  }

  // Elimina bloques custom huérfanos (sin sección correspondiente)
  const customIds = new Set(customSections.map((s) => s.id));
  return result.filter((b) => !isCustomSectionId(b.id) || customIds.has(b.id));
}

export function parseQuotationTemplateLayout(raw: unknown): QuotationTemplateLayout {
  // Migración: añadir quoteMeta si no existe
  if (raw !== null && typeof raw === "object" && !("quoteMeta" in raw)) {
    (raw as Record<string, unknown>).quoteMeta = {
      titleAlign: "left",
      titleSize: 18,
      titleBold: true,
      subtitleAlign: "left",
      subtitleSize: 12,
      subtitleBold: false,
    };
  }
  // Migración: si lines no tiene sectionTitle, añadirlo
  if (
    raw !== null &&
    typeof raw === "object" &&
    "lines" in raw &&
    raw.lines !== null &&
    typeof raw.lines === "object" &&
    !("sectionTitle" in raw.lines)
  ) {
    (raw as Record<string, unknown>).lines = {
      ...(raw as { lines: object }).lines,
      sectionTitle: "Detalle",
    };
  }
  // Migración: si terms no tiene sectionTitle, añadirlo
  if (
    raw !== null &&
    typeof raw === "object" &&
    "terms" in raw &&
    raw.terms !== null &&
    typeof raw.terms === "object" &&
    !("sectionTitle" in raw.terms)
  ) {
    (raw as Record<string, unknown>).terms = {
      ...(raw as { terms: object }).terms,
      sectionTitle: "Términos y condiciones",
    };
  }
  // Migración: añadir customSections si no existe
  if (raw !== null && typeof raw === "object" && !("customSections" in raw)) {
    (raw as Record<string, unknown>).customSections = [];
  }
  // Migración: etiquetas IVA en totals
  if (
    raw !== null &&
    typeof raw === "object" &&
    "totals" in raw &&
    raw.totals !== null &&
    typeof raw.totals === "object"
  ) {
    const totals = raw.totals as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (!("labelVat" in totals)) patch.labelVat = "IVA (19%)";
    if (!("labelVatIncluded" in totals)) patch.labelVatIncluded = "IVA (19%) incluido en el total";
    if (Object.keys(patch).length > 0) {
      (raw as Record<string, unknown>).totals = { ...totals, ...patch };
    }
  }

  // Migración: añadir footer.showPageNumber / showBody / distribution si no existen
  if (
    raw !== null &&
    typeof raw === "object" &&
    "footer" in raw &&
    raw.footer !== null &&
    typeof raw.footer === "object"
  ) {
    const footer = raw.footer as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (!("showPageNumber" in footer)) patch.showPageNumber = false;
    if (!("showBody" in footer)) patch.showBody = true;
    if (!("distribution" in footer)) patch.distribution = "center";
    if (Object.keys(patch).length > 0) {
      (raw as Record<string, unknown>).footer = { ...footer, ...patch };
    }
  }

  // Migración: añadir client.showLabel* si no existen
  if (
    raw !== null &&
    typeof raw === "object" &&
    "client" in raw &&
    raw.client !== null &&
    typeof raw.client === "object"
  ) {
    const client = raw.client as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (!("showLabelName" in client)) patch.showLabelName = true;
    if (!("showLabelEmail" in client)) patch.showLabelEmail = true;
    if (!("showLabelPhone" in client)) patch.showLabelPhone = true;
    if (!("showLabelServiceDate" in client)) patch.showLabelServiceDate = true;
    if (!("showNotes" in client)) patch.showNotes = false;
    if (!("labelNotes" in client)) patch.labelNotes = "Notas adicionales";
    if (!("showLabelNotes" in client)) patch.showLabelNotes = true;
    if (Object.keys(patch).length > 0) {
      (raw as Record<string, unknown>).client = { ...client, ...patch };
    }
  }

  // Migración: añadir signature si no existe
  if (raw !== null && typeof raw === "object" && !("signature" in raw)) {
    (raw as Record<string, unknown>).signature = {
      align: "left",
      rows: [
        { text: "____________________", size: 10, bold: false, italic: false },
        { text: "", size: 10, bold: false, italic: false },
        { text: "Cargo / empresa", size: 9, bold: false, italic: true },
      ],
    };
  }

  // Migración: añadir bodyAlign/bodySize/bodyBold/fieldRefs a custom sections existentes
  if (
    raw !== null &&
    typeof raw === "object" &&
    "customSections" in raw &&
    Array.isArray((raw as { customSections: unknown[] }).customSections)
  ) {
    (raw as Record<string, unknown>).customSections = (
      raw as { customSections: unknown[] }
    ).customSections.map((s) => {
      if (s !== null && typeof s === "object") {
        const patch: Record<string, unknown> = {};
        if (!("bodyAlign" in s)) patch.bodyAlign = "left";
        if (!("bodySize" in s)) patch.bodySize = 9;
        if (!("bodyBold" in s)) patch.bodyBold = false;
        if (!("fieldRefs" in s)) patch.fieldRefs = [];
        if (Object.keys(patch).length > 0) return { ...(s as object), ...patch };
      }
      return s;
    });
  }

  // Migración: insertar bloque signature antes de footer si no existe en blocks
  if (
    raw !== null &&
    typeof raw === "object" &&
    "blocks" in raw &&
    Array.isArray(raw.blocks)
  ) {
    const blocks = raw.blocks as { id: string; enabled: boolean }[];
    if (!blocks.some((b) => b.id === "signature")) {
      const footerIdx = blocks.findIndex((b) => b.id === "footer");
      const insertAt = footerIdx >= 0 ? footerIdx : blocks.length;
      blocks.splice(insertAt, 0, { id: "signature", enabled: false });
      (raw as Record<string, unknown>).blocks = blocks;
    }
  }

  const parsed = quotationTemplateLayoutSchema.safeParse(raw);
  if (parsed.success) {
    return {
      ...parsed.data,
      blocks: normalizeQuotationTemplateBlocks(parsed.data.blocks, parsed.data.customSections),
    };
  }
  return defaultQuotationTemplateLayout();
}

export function getBlockLabel(layout: QuotationTemplateLayout, blockId: string): string {
  if (blockId in QUOTATION_TEMPLATE_BLOCK_LABELS) {
    return QUOTATION_TEMPLATE_BLOCK_LABELS[blockId as QuotationTemplateBlockId];
  }
  return layout.customSections.find((s) => s.id === blockId)?.title ?? "Sección personalizada";
}

export function orderedEnabledBlocks(layout: QuotationTemplateLayout): string[] {
  return layout.blocks.filter((b) => b.enabled).map((b) => b.id);
}

export function moveBlock(
  layout: QuotationTemplateLayout,
  blockId: string,
  direction: "up" | "down",
): QuotationTemplateLayout {
  const blocks = [...layout.blocks];
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx < 0) return layout;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= blocks.length) return layout;
  [blocks[idx], blocks[swap]] = [blocks[swap]!, blocks[idx]!];
  return { ...layout, blocks };
}

export function toggleBlock(
  layout: QuotationTemplateLayout,
  blockId: string,
  enabled: boolean,
): QuotationTemplateLayout {
  return {
    ...layout,
    blocks: layout.blocks.map((b) => (b.id === blockId ? { ...b, enabled } : b)),
  };
}

export function addCustomSection(layout: QuotationTemplateLayout): QuotationTemplateLayout {
  const id = makeCustomSectionId();
  const newSection: QuotationCustomSection = {
    id,
    title: "Nueva sección",
    body: "",
    bodyAlign: "left",
    bodySize: 9,
    bodyBold: false,
    fieldRefs: [],
  };
  return {
    ...layout,
    customSections: [...layout.customSections, newSection],
    blocks: [...layout.blocks, { id, enabled: true }],
  };
}

export function updateCustomSection(
  layout: QuotationTemplateLayout,
  id: string,
  patch: Partial<Omit<QuotationCustomSection, "id">>,
): QuotationTemplateLayout {
  return {
    ...layout,
    customSections: layout.customSections.map((s) =>
      s.id === id ? { ...s, ...patch } : s,
    ),
  };
}

export function removeCustomSection(
  layout: QuotationTemplateLayout,
  id: string,
): QuotationTemplateLayout {
  return {
    ...layout,
    customSections: layout.customSections.filter((s) => s.id !== id),
    blocks: layout.blocks.filter((b) => b.id !== id),
  };
}
