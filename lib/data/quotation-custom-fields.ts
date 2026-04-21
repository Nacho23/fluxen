import { prisma } from "@/lib/db/prisma";

import type { QuotationCustomFieldRow } from "@/lib/data/quotation-custom-fields-public";

export async function listQuotationCustomFieldsForCompany(
  companyId: string,
): Promise<QuotationCustomFieldRow[]> {
  const rows = await prisma.quotationCustomField.findMany({
    where: { companyId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      key: true,
      label: true,
      fieldType: true,
      required: true,
      sortOrder: true,
    },
  });
  return rows as QuotationCustomFieldRow[];
}
