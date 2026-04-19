import { prisma } from "@/lib/db/prisma";

export type CompanyDocumentFolderRow = Awaited<
  ReturnType<typeof getCompanyFolders>
>[number];

export async function getCompanyFolders(companyId: string) {
  return prisma.companyDocumentFolder.findMany({
    where: { companyId },
    orderBy: [{ name: "asc" }],
  });
}

/** Valida que la carpeta exista en la empresa; si no, devuelve null (explorador en raíz). */
export async function resolveFolderIdOrNull(
  companyId: string,
  raw: string | undefined,
): Promise<string | null> {
  if (!raw || raw.trim() === "") return null;
  const f = await prisma.companyDocumentFolder.findFirst({
    where: { id: raw.trim(), companyId },
    select: { id: true },
  });
  return f?.id ?? null;
}
