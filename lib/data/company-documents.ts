import { prisma } from "@/lib/db/prisma";

export type CompanyDocumentRow = Awaited<
  ReturnType<typeof getCompanyDocumentsWithUploader>
>[number];

export async function getCompanyDocumentsWithUploader(companyId: string) {
  return prisma.companyDocument.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      companyId: true,
      uploadedByUserId: true,
      folderId: true,
      title: true,
      originalFilename: true,
      storageKey: true,
      mimeType: true,
      sizeBytes: true,
      othersCanView: true,
      othersCanEdit: true,
      othersCanDelete: true,
      createdAt: true,
      updatedAt: true,
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
