import type { ClientKind } from "@/lib/prisma/enums-public";

import { prisma } from "@/lib/db/prisma";

export type ClientRow = {
  id: string;
  kind: ClientKind;
  name: string;
  email: string | null;
  phone: string | null;
  rut: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function serialize(row: {
  id: string;
  kind: ClientKind;
  name: string;
  email: string | null;
  phone: string | null;
  rut: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ClientRow {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getClientsForCompany(companyId: string): Promise<ClientRow[]> {
  const rows = await prisma.companyClient.findMany({
    where: { companyId },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  return rows.map(serialize);
}
