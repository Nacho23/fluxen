import type { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const paymentListSelect = {
  id: true,
  paymentMethod: true,
  serviceDate: true,
  activityDescription: true,
  amount: true,
  tip: true,
  total: true,
  transactionCode: true,
  status: true,
  signedAt: true,
  createdAt: true,
  worker: { select: { id: true, name: true, email: true } },
  recordedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.PaymentSelect;

export type PaymentListRow = {
  id: string;
  paymentMethod: PaymentMethod;
  serviceDate: Date | null;
  activityDescription: string;
  amount: string;
  tip: string;
  total: string;
  transactionCode: string | null;
  status: PaymentStatus;
  signedAt: Date | null;
  createdAt: Date;
  worker: { id: string; name: string; email: string };
  recordedBy: { id: string; name: string; email: string };
};

function mapPaymentListRow(r: Prisma.PaymentGetPayload<{ select: typeof paymentListSelect }>): PaymentListRow {
  return {
    ...r,
    amount: r.amount.toString(),
    tip: r.tip.toString(),
    total: r.total.toString(),
  };
}

export async function listPaymentsForCompany(companyId: string): Promise<PaymentListRow[]> {
  const rows = await prisma.payment.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: paymentListSelect,
    take: 200,
  });
  return rows.map(mapPaymentListRow);
}

export async function listPaymentsForWorker(
  companyId: string,
  workerUserId: string,
): Promise<PaymentListRow[]> {
  const rows = await prisma.payment.findMany({
    where: { companyId, workerUserId },
    orderBy: { createdAt: "desc" },
    select: paymentListSelect,
    take: 200,
  });
  return rows.map(mapPaymentListRow);
}

const paymentDetailArgs = {
  include: {
    worker: { select: { id: true, name: true, email: true } },
    recordedBy: { select: { id: true, name: true, email: true } },
    signedBy: { select: { id: true, name: true, email: true } },
    company: { select: { name: true } },
  },
} satisfies Prisma.PaymentFindFirstArgs;

export type PaymentDetail = Prisma.PaymentGetPayload<typeof paymentDetailArgs>;

export async function getPaymentForCompany(
  id: string,
  companyId: string,
): Promise<PaymentDetail | null> {
  return prisma.payment.findFirst({
    where: { id, companyId },
    ...paymentDetailArgs,
  });
}

export type CompanyMemberOption = {
  userId: string;
  name: string;
  email: string;
  role: string;
};

export async function listCompanyMembersForPaymentSelect(
  companyId: string,
): Promise<CompanyMemberOption[]> {
  const rows = await prisma.companyMember.findMany({
    where: { companyId },
    orderBy: { user: { name: "asc" } },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return rows.map((r) => ({
    userId: r.user.id,
    name: r.user.name,
    email: r.user.email,
    role: r.role,
  }));
}
