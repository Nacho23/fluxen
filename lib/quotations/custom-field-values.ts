import type { QuotationCustomFieldRow } from "@/lib/data/quotation-custom-fields-public";
import type { QuotationCustomFieldType } from "@/lib/prisma/enums-public";

export type NormalizedCustomFieldValues = Record<string, string | number | null>;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function toInputString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  return "";
}

function validateOne(
  label: string,
  fieldType: QuotationCustomFieldType,
  required: boolean,
  s: string,
): { ok: true; value: string | number | null } | { ok: false; error: string } {
  const t = s.trim();
  if (required && t === "") {
    return { ok: false, error: `Completa «${label}».` };
  }
  if (t === "") {
    return { ok: true, value: null };
  }

  switch (fieldType) {
    case "TEXT": {
      if (t.length > 500) return { ok: false, error: `«${label}»: máximo 500 caracteres.` };
      return { ok: true, value: t };
    }
    case "TEXTAREA": {
      if (t.length > 5000) return { ok: false, error: `«${label}»: máximo 5000 caracteres.` };
      return { ok: true, value: t };
    }
    case "NUMBER": {
      const n = Number(t.replace(",", "."));
      if (Number.isNaN(n)) return { ok: false, error: `«${label}»: número no válido.` };
      return { ok: true, value: n };
    }
    case "DATE": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
        return { ok: false, error: `«${label}»: fecha no válida.` };
      }
      const [yy, mm, dd] = t.split("-").map(Number);
      const dt = new Date(Date.UTC(yy, mm - 1, dd));
      if (
        Number.isNaN(dt.getTime()) ||
        dt.getUTCFullYear() !== yy ||
        dt.getUTCMonth() !== mm - 1 ||
        dt.getUTCDate() !== dd
      ) {
        return { ok: false, error: `«${label}»: fecha no válida.` };
      }
      return { ok: true, value: t };
    }
    default:
      return { ok: false, error: "Tipo de campo no soportado." };
  }
}

/**
 * Valida entradas del formulario (strings) contra las definiciones de la empresa.
 * Las claves del resultado son los ids de `QuotationCustomField`.
 */
export function validateAndNormalizeCustomFieldValues(
  definitions: QuotationCustomFieldRow[],
  raw: unknown,
):
  | { ok: true; values: NormalizedCustomFieldValues }
  | { ok: false; error: string } {
  const rawRecord: Record<string, string> = {};
  if (raw === undefined || raw === null) {
    // vacío
  } else if (!isPlainObject(raw)) {
    return { ok: false, error: "Formato inválido en campos personalizados." };
  } else {
    for (const [k, v] of Object.entries(raw)) {
      rawRecord[k] = toInputString(v);
    }
  }

  const out: NormalizedCustomFieldValues = {};

  for (const d of definitions) {
    const s = rawRecord[d.id] ?? "";
    const res = validateOne(d.label, d.fieldType, d.required, s);
    if (!res.ok) return res;
    out[d.id] = res.value;
  }

  return { ok: true, values: out };
}

export function parseStoredCustomFieldValues(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...(raw as Record<string, unknown>) };
}

export function formatCustomFieldValueForDisplay(
  fieldType: QuotationCustomFieldType,
  value: unknown,
): string {
  if (value === null || value === undefined) return "—";
  if (fieldType === "NUMBER" && typeof value === "number") {
    return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 6 }).format(value);
  }
  if (typeof value === "string") return value.length > 0 ? value : "—";
  if (typeof value === "number") return String(value);
  return String(value);
}
