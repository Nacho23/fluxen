import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { DocumentsPanel } from "@/components/documentos/documents-panel";
import { PageHeader } from "@/components/layout/page-header";
import { authOptions } from "@/lib/auth/options";
import { requirePermission, sessionHasPermission } from "@/lib/auth/check-permission";
import { getActiveCompanyRole } from "@/lib/auth/permissions";
import {
  canViewDocument,
  canViewFolder,
  canViewFolderPath,
} from "@/lib/documentos/access";
import { getCompanyFolders, resolveFolderIdOrNull } from "@/lib/data/company-document-folders";
import { getCompanyDocumentsWithUploader } from "@/lib/data/company-documents";
import { isR2Configured } from "@/lib/storage/r2";

type Props = Readonly<{
  searchParams: Promise<{ carpeta?: string }>;
}>;

export default async function DocumentosPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.activeCompanyId || !session.user?.id) {
    redirect("/dashboard");
  }
  await requirePermission(session, "documentos", "read");

  const role = getActiveCompanyRole(session);
  if (!role) {
    redirect("/dashboard");
  }

  const viewer = { userId: session.user.id, role };

  const sp = await searchParams;
  const rawCarpeta = typeof sp.carpeta === "string" ? sp.carpeta : undefined;
  const currentFolderId = await resolveFolderIdOrNull(session.activeCompanyId, rawCarpeta);
  if (rawCarpeta && rawCarpeta.trim().length > 0 && !currentFolderId) {
    redirect("/documentos");
  }

  const [canCreate, canUpdateMatrix, canDeleteMatrix, allFolders, allDocs] = await Promise.all([
    sessionHasPermission(session, "documentos", "create"),
    sessionHasPermission(session, "documentos", "update"),
    sessionHasPermission(session, "documentos", "delete"),
    getCompanyFolders(session.activeCompanyId),
    getCompanyDocumentsWithUploader(session.activeCompanyId),
  ]);

  if (currentFolderId && !canViewFolderPath(viewer, currentFolderId, allFolders)) {
    redirect("/documentos");
  }

  const visibleFolders = allFolders.filter((f) => canViewFolder(viewer, f));

  const visibleDocs = allDocs.filter((d) => {
    if (
      !canViewDocument(viewer, {
        uploadedByUserId: d.uploadedByUserId,
        othersCanView: d.othersCanView,
        othersCanEdit: d.othersCanEdit,
        othersCanDelete: d.othersCanDelete,
      })
    ) {
      return false;
    }
    if (d.folderId) {
      return canViewFolderPath(viewer, d.folderId, allFolders);
    }
    return true;
  });

  const serializedDocs = visibleDocs.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  const serializedFolders = visibleFolders.map((f) => ({
    id: f.id,
    parentId: f.parentId,
    name: f.name,
    createdByUserId: f.createdByUserId,
    othersCanView: f.othersCanView,
    othersCanEdit: f.othersCanEdit,
    othersCanDelete: f.othersCanDelete,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documentos"
        description="Biblioteca por empresa. Carpetas y archivos pueden restringir quién ve, edita o elimina (como la matriz de permisos por rol)."
      />
      <DocumentsPanel
        initialFolders={serializedFolders}
        initialDocuments={serializedDocs}
        currentFolderId={currentFolderId}
        currentUserId={session.user.id}
        role={role}
        canCreate={canCreate}
        canUpdateMatrix={canUpdateMatrix}
        canDeleteMatrix={canDeleteMatrix}
        storageReady={isR2Configured()}
      />
    </div>
  );
}
