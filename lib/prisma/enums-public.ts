/**
 * Valores alineados con los enums de Prisma. Usar en "use client" y en módulos
 * compartidos con el cliente para no empaquetar `@prisma/client` en el navegador
 * (p. ej. Turbopack + index-browser).
 */

export const CompanyRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  OPS_ADMIN: "OPS_ADMIN",
  FIELD: "FIELD",
} as const;
export type CompanyRole = (typeof CompanyRole)[keyof typeof CompanyRole];

export const ClientKind = {
  PERSON: "PERSON",
  ORGANIZATION: "ORGANIZATION",
} as const;
export type ClientKind = (typeof ClientKind)[keyof typeof ClientKind];

export const QuoteDiscountMode = {
  NONE: "NONE",
  PERCENT: "PERCENT",
  FIXED: "FIXED",
} as const;
export type QuoteDiscountMode = (typeof QuoteDiscountMode)[keyof typeof QuoteDiscountMode];

export const QuotationCustomFieldType = {
  TEXT: "TEXT",
  TEXTAREA: "TEXTAREA",
  NUMBER: "NUMBER",
  DATE: "DATE",
} as const;
export type QuotationCustomFieldType =
  (typeof QuotationCustomFieldType)[keyof typeof QuotationCustomFieldType];

export const AgendaEventSource = {
  MANUAL: "MANUAL",
  QUOTATION: "QUOTATION",
  WORK_ORDER: "WORK_ORDER",
} as const;
export type AgendaEventSource = (typeof AgendaEventSource)[keyof typeof AgendaEventSource];

export const AgendaAttendanceStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const;
export type AgendaAttendanceStatus =
  (typeof AgendaAttendanceStatus)[keyof typeof AgendaAttendanceStatus];

export const QuotationStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
} as const;
export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

export const PaymentMethod = {
  CASH: "CASH",
  TRANSFER: "TRANSFER",
  CHECK: "CHECK",
  CARD: "CARD",
  OTHER: "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING_SIGNATURE: "PENDING_SIGNATURE",
  SIGNED: "SIGNED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const WorkOrderStatus = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESCHEDULED: "RESCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];

export const SidebarPanelStyle = {
  STANDARD: "STANDARD",
  BRANDED: "BRANDED",
} as const;
export type SidebarPanelStyle = (typeof SidebarPanelStyle)[keyof typeof SidebarPanelStyle];
