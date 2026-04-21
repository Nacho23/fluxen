import type { QuotationCustomFieldType } from "@/lib/prisma/enums-public";

export const QUOTATION_CUSTOM_FIELD_TYPE_LABEL: Record<QuotationCustomFieldType, string> = {
  TEXT: "Texto corto",
  TEXTAREA: "Texto largo",
  NUMBER: "Número",
  DATE: "Fecha",
};

export type QuotationCustomFieldRow = {
  id: string;
  key: string;
  label: string;
  fieldType: QuotationCustomFieldType;
  required: boolean;
  sortOrder: number;
};
