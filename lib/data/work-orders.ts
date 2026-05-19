import type { Prisma } from "@prisma/client";

import type { WorkOrderStatus } from "@/lib/prisma/enums-public";

import { prisma } from "@/lib/db/prisma";

const listSelect = {
  id: true,
  orderNumber: true,
  title: true,
  status: true,
  scheduledAt: true,
  completedAt: true,
  createdAt: true,
  assignedTo: { select: { id: true, name: true, email: true } },
  agendaEvent: { select: { id: true, title: true } },
  quotation: { select: { id: true, quoteNumber: true, clientName: true } },
} satisfies Prisma.WorkOrderSelect;

export type WorkOrderListRow = {
  id: string;
  orderNumber: string;
  title: string;
  status: WorkOrderStatus;
  scheduledAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  assignedTo: { id: string; name: string; email: string } | null;
  agendaEvent: { id: string; title: string } | null;
  quotation: { id: string; quoteNumber: string; clientName: string } | null;
};

const detailInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  agendaEvent: { select: { id: true, title: true, startAt: true, endAt: true } },
  quotation: {
    select: { id: true, quoteNumber: true, clientName: true, status: true, total: true },
  },
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
    include: {
      changedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      worker: { select: { id: true, name: true } },
    },
  },
  company: { select: { name: true } },
} satisfies Prisma.WorkOrderInclude;

export type WorkOrderDetail = Prisma.WorkOrderGetPayload<{ include: typeof detailInclude }>;

export async function listWorkOrdersForCompany(companyId: string): Promise<WorkOrderListRow[]> {
  return prisma.workOrder.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: listSelect,
    take: 300,
  });
}

export async function listWorkOrdersVisibleToUser(
  companyId: string,
  userId: string,
): Promise<WorkOrderListRow[]> {
  return prisma.workOrder.findMany({
    where: {
      companyId,
      OR: [{ assignedUserId: userId }, { createdByUserId: userId }],
    },
    orderBy: { createdAt: "desc" },
    select: listSelect,
    take: 300,
  });
}

export async function getWorkOrderForCompany(
  id: string,
  companyId: string,
): Promise<WorkOrderDetail | null> {
  return prisma.workOrder.findFirst({
    where: { id, companyId },
    include: detailInclude,
  });
}

export type WorkOrderLinkOption = {
  id: string;
  label: string;
};

export async function listAgendaEventsForWorkOrderLink(
  companyId: string,
): Promise<WorkOrderLinkOption[]> {
  const rows = await prisma.agendaEvent.findMany({
    where: {
      companyId,
      workOrder: null,
    },
    orderBy: { startAt: "desc" },
    take: 100,
    select: { id: true, title: true, startAt: true },
  });
  const fmt = new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return rows.map((r) => ({
    id: r.id,
    label: `${r.title} (${fmt.format(r.startAt)})`,
  }));
}

export async function listQuotationsForWorkOrderLink(
  companyId: string,
): Promise<WorkOrderLinkOption[]> {
  const rows = await prisma.quotation.findMany({
    where: {
      companyId,
      workOrder: null,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, quoteNumber: true, clientName: true, status: true },
  });
  return rows.map((r) => ({
    id: r.id,
    label: `${r.quoteNumber} · ${r.clientName}`,
  }));
}

export type WorkOrderPaymentOption = {
  id: string;
  orderNumber: string;
  title: string;
  status: WorkOrderStatus;
  assignedUserId: string | null;
};

export async function listWorkOrdersForPaymentSelect(
  companyId: string,
): Promise<WorkOrderPaymentOption[]> {
  return prisma.workOrder.findMany({
    where: {
      companyId,
      status: { not: "CANCELLED" },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      orderNumber: true,
      title: true,
      status: true,
      assignedUserId: true,
    },
  });
}

export type CompanyMemberOption = {
  userId: string;
  name: string;
  email: string;
};

export async function listCompanyMembersForWorkOrderSelect(
  companyId: string,
): Promise<CompanyMemberOption[]> {
  const rows = await prisma.companyMember.findMany({
    where: { companyId },
    orderBy: { user: { name: "asc" } },
    select: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return rows.map((r) => ({
    userId: r.user.id,
    name: r.user.name,
    email: r.user.email,
  }));
}
