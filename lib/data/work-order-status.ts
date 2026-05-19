import type { WorkOrderStatus } from "@/lib/prisma/enums-public";

export const WORK_ORDER_STATUS_LABEL: Record<WorkOrderStatus, string> = {
  PENDING: "Pendiente",
  ASSIGNED: "Asignada",
  IN_PROGRESS: "En ejecución",
  RESCHEDULED: "Reagendada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export const WORK_ORDER_STATUS_ORDER: WorkOrderStatus[] = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
];

export const WORK_ORDER_ALLOWED_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PENDING: ["ASSIGNED", "IN_PROGRESS", "RESCHEDULED", "CANCELLED"],
  ASSIGNED: ["PENDING", "IN_PROGRESS", "RESCHEDULED", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["ASSIGNED", "RESCHEDULED", "COMPLETED", "CANCELLED"],
  RESCHEDULED: ["PENDING", "ASSIGNED", "IN_PROGRESS", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const WORK_ORDER_CLOSED_STATUSES: WorkOrderStatus[] = ["COMPLETED", "CANCELLED"];

export function isWorkOrderClosed(status: WorkOrderStatus): boolean {
  return WORK_ORDER_CLOSED_STATUSES.includes(status);
}

export function canTransitionWorkOrderStatus(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
): boolean {
  if (from === to) return true;
  return WORK_ORDER_ALLOWED_TRANSITIONS[from].includes(to);
}
