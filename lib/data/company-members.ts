import { CompanyRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type MemberRow = {
  id: string;
  userId: string;
  role: CompanyRole;
  email: string;
  name: string;
  rut: string | null;
  phone: string | null;
  address: string | null;
  bankName: string | null;
  bankAccountType: string | null;
  bankAccountNumber: string | null;
};

export async function getCompanyMembersForCompany(companyId: string): Promise<MemberRow[]> {
  const members = await prisma.companyMember.findMany({
    where: { companyId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          rut: true,
          phone: true,
          address: true,
          bankName: true,
          bankAccountType: true,
          bankAccountNumber: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role as CompanyRole,
    email: m.user.email,
    name: m.user.name,
    rut: m.user.rut,
    phone: m.user.phone,
    address: m.user.address,
    bankName: m.user.bankName,
    bankAccountType: m.user.bankAccountType,
    bankAccountNumber: m.user.bankAccountNumber,
  }));
}
