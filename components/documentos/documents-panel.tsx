"use client";

import { CompanyRole } from "@prisma/client";
import {
  ChevronRight,
  File,
  FileSpreadsheet,
  FileText,
  Folder,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DocumentUploadModal } from "@/components/documentos/document-upload-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  canDeleteDocument,
  canDeleteFolderPolicy,
  canEditDocumentMeta,
  canEditFolderMeta,
  type DocumentPolicy,
} from "@/lib/documentos/access";
import {
  buildFolderBreadcrumb,
  flattenFoldersForSelect,
  parseFolderSelectValue,
  ROOT_FOLDER_VALUE,
} from "@/lib/documentos/explorer-utils";
import type { CompanyDocumentRow } from "@/lib/data/company-documents";
import {
  createDocumentFolder,
  deleteDocumentFolder,
  updateDocumentFolder,
} from "@/server/actions/document-folders";
import {
  deleteCompanyDocument,
  getDocumentDownloadUrl,
  updateCompanyDocument,
} from "@/server/actions/documents";
import { cn } from "@/lib/utils";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function policySummary(doc: DocumentPolicy): string {
  const parts: string[] = [];
  parts.push(doc.othersCanView ? "Visible" : "Restringido");
  parts.push(doc.othersCanEdit ? "Edición según rol" : "Edición autor");
  parts.push(doc.othersCanDelete ? "Baja según rol" : "Baja autor");
  return parts.join(" · ");
}

function spreadsheetExt(filename: string): boolean {
  const i = filename.lastIndexOf(".");
  if (i < 0) return false;
  const ext = filename.slice(i).toLowerCase();
  return [".xlsx", ".xls", ".xlsm", ".xlsb", ".ods", ".csv", ".tsv"].includes(ext);
}

function FileThumb({ mime, filename }: { mime: string; filename: string }) {
  if (mime.startsWith("image/")) {
    return <ImageIcon className="text-primary size-11 shrink-0" aria-hidden />;
  }
  if (mime === "application/pdf") {
    return <FileText className="size-11 shrink-0 text-red-600/90 dark:text-red-400/90" aria-hidden />;
  }
  if (
    mime.includes("spreadsheet") ||
    mime.includes("ms-excel") ||
    mime === "text/csv" ||
    mime === "text/tab-separated-values" ||
    spreadsheetExt(filename)
  ) {
    return <FileSpreadsheet className="size-11 shrink-0 text-emerald-600/90 dark:text-emerald-400/90" aria-hidden />;
  }
  return <File className="text-muted-foreground size-11 shrink-0" aria-hidden />;
}

export type DocumentRowSerialized = Omit<
  CompanyDocumentRow,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export type FolderRowSerialized = {
  id: string;
  parentId: string | null;
  name: string;
  createdByUserId: string;
  othersCanView: boolean;
  othersCanEdit: boolean;
  othersCanDelete: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Evita `undefined` en inputs controlados (React exige valor estable). */
function folderToEditState(f: FolderRowSerialized) {
  return {
    id: f.id,
    name: f.name ?? "",
    othersCanView: f.othersCanView ?? true,
    othersCanEdit: f.othersCanEdit ?? true,
    othersCanDelete: f.othersCanDelete ?? false,
  };
}

export function DocumentsPanel({
  initialFolders,
  initialDocuments,
  currentFolderId,
  currentUserId,
  role,
  canCreate,
  canUpdateMatrix,
  canDeleteMatrix,
  storageReady,
}: Readonly<{
  initialFolders: FolderRowSerialized[];
  initialDocuments: DocumentRowSerialized[];
  currentFolderId: string | null;
  currentUserId: string;
  role: CompanyRole;
  canCreate: boolean;
  canUpdateMatrix: boolean;
  canDeleteMatrix: boolean;
  storageReady: boolean;
}>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderOthersView, setNewFolderOthersView] = useState(true);
  const [newFolderOthersEdit, setNewFolderOthersEdit] = useState(true);
  const [newFolderOthersDelete, setNewFolderOthersDelete] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{
    id: string;
    name: string;
    othersCanView: boolean;
    othersCanEdit: boolean;
    othersCanDelete: boolean;
  } | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentRowSerialized | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editOthersView, setEditOthersView] = useState(true);
  const [editOthersEdit, setEditOthersEdit] = useState(true);
  const [editOthersDelete, setEditOthersDelete] = useState(false);
  const [editFolderValue, setEditFolderValue] = useState(ROOT_FOLDER_VALUE);

  const breadcrumb = useMemo(
    () => buildFolderBreadcrumb(initialFolders, currentFolderId),
    [initialFolders, currentFolderId],
  );

  const subfolders = useMemo(
    () =>
      initialFolders
        .filter((f) => (f.parentId ?? null) === (currentFolderId ?? null))
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [initialFolders, currentFolderId],
  );

  const filesHere = useMemo(
    () =>
      initialDocuments
        .filter((d) => (d.folderId ?? null) === (currentFolderId ?? null))
        .sort((a, b) => {
          const na = a.title?.trim() || a.originalFilename;
          const nb = b.title?.trim() || b.originalFilename;
          return na.localeCompare(nb, "es");
        }),
    [initialDocuments, currentFolderId],
  );

  const folderOptions = useMemo(() => flattenFoldersForSelect(initialFolders), [initialFolders]);

  function policyFromRow(d: DocumentRowSerialized): DocumentPolicy {
    return {
      uploadedByUserId: d.uploadedByUserId,
      othersCanView: d.othersCanView,
      othersCanEdit: d.othersCanEdit,
      othersCanDelete: d.othersCanDelete,
    };
  }

  const rowMeta = useMemo(() => {
    const map = new Map<string, { canEdit: boolean; canDelete: boolean }>();
    for (const d of initialDocuments) {
      const pol = policyFromRow(d);
      map.set(d.id, {
        canEdit: canEditDocumentMeta({ userId: currentUserId, role }, pol, canUpdateMatrix),
        canDelete: canDeleteDocument({ userId: currentUserId, role }, pol, canDeleteMatrix),
      });
    }
    return map;
  }, [initialDocuments, currentUserId, role, canUpdateMatrix, canDeleteMatrix]);

  function folderPolicyFromRow(f: FolderRowSerialized) {
    return {
      createdByUserId: f.createdByUserId,
      othersCanView: f.othersCanView,
      othersCanEdit: f.othersCanEdit,
      othersCanDelete: f.othersCanDelete,
    };
  }

  const folderRowMeta = useMemo(() => {
    const map = new Map<string, { canEdit: boolean; canDelete: boolean }>();
    for (const f of initialFolders) {
      const pol = folderPolicyFromRow(f);
      map.set(f.id, {
        canEdit: canEditFolderMeta({ userId: currentUserId, role }, pol, canUpdateMatrix),
        canDelete: canDeleteFolderPolicy({ userId: currentUserId, role }, pol, canDeleteMatrix),
      });
    }
    return map;
  }, [initialFolders, currentUserId, role, canUpdateMatrix, canDeleteMatrix]);

  function startEditDoc(d: DocumentRowSerialized) {
    setEditingDoc(d);
    setEditTitle(d.title ?? "");
    setEditOthersView(d.othersCanView ?? true);
    setEditOthersEdit(d.othersCanEdit ?? true);
    setEditOthersDelete(d.othersCanDelete ?? false);
    setEditFolderValue(d.folderId ?? ROOT_FOLDER_VALUE);
    setError(null);
  }

  async function onDownload(id: string) {
    setError(null);
    setPending(`dl-${id}`);
    const res = await getDocumentDownloadUrl(id);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    window.location.href = res.url;
  }

  async function onDeleteDoc(id: string) {
    if (!confirm("¿Eliminar este archivo?")) return;
    setError(null);
    setPending(id);
    const res = await deleteCompanyDocument(id);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function onSaveEditDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDoc) return;
    setError(null);
    setPending(editingDoc.id);
    const res = await updateCompanyDocument({
      id: editingDoc.id,
      title: editTitle.trim() === "" ? null : editTitle.trim(),
      othersCanView: editOthersView,
      othersCanEdit: editOthersEdit,
      othersCanDelete: editOthersDelete,
      folderId: parseFolderSelectValue(editFolderValue),
    });
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditingDoc(null);
    router.refresh();
  }

  async function onCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    setPending("mkdir");
    const res = await createDocumentFolder({
      name,
      parentId: currentFolderId,
      othersCanView: newFolderOthersView,
      othersCanEdit: newFolderOthersEdit,
      othersCanDelete: newFolderOthersDelete,
    });
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCreateFolderOpen(false);
    setNewFolderName("");
    setNewFolderOthersView(true);
    setNewFolderOthersEdit(true);
    setNewFolderOthersDelete(false);
    router.refresh();
  }

  async function onSaveEditFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFolder) return;
    const name = editingFolder.name.trim();
    if (!name) return;
    setPending("folder-edit");
    const res = await updateDocumentFolder({
      id: editingFolder.id,
      name,
      othersCanView: editingFolder.othersCanView,
      othersCanEdit: editingFolder.othersCanEdit,
      othersCanDelete: editingFolder.othersCanDelete,
    });
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditingFolder(null);
    router.refresh();
  }

  async function onDeleteFolder(id: string, name: string) {
    if (!confirm(`¿Eliminar la carpeta "${name}"? (debe estar vacía)`)) return;
    setPending(`rmdir-${id}`);
    const res = await deleteDocumentFolder(id);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (currentFolderId === id) {
      router.push("/documentos");
    } else {
      router.refresh();
    }
  }

  const isEmpty = subfolders.length === 0 && filesHere.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-1 text-sm" aria-label="Ruta">
          <Link
            href="/documentos"
            className={cn(
              "hover:text-foreground shrink-0 rounded-md px-1 py-0.5 transition-colors",
              !currentFolderId ? "text-foreground font-medium" : "",
            )}
          >
            Inicio
          </Link>
          {breadcrumb.map((seg) => (
            <span key={seg.id} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />
              <Link
                href={`/documentos?carpeta=${seg.id}`}
                className={cn(
                  "hover:text-foreground truncate rounded-md px-1 py-0.5 transition-colors",
                  seg.id === currentFolderId ? "text-foreground font-medium" : "",
                )}
              >
                {seg.name}
              </Link>
            </span>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          {canCreate ? (
            <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={() => setCreateFolderOpen(true)}>
              <Plus className="size-4" />
              Nueva carpeta
            </Button>
          ) : null}
          {canCreate && storageReady ? (
            <Button type="button" size="sm" className="gap-1.5" onClick={() => setUploadOpen(true)}>
              <Upload className="size-4" />
              Subir documento
            </Button>
          ) : null}
        </div>
      </div>

      {canCreate && !storageReady ? (
        <p className="text-destructive text-sm" role="alert">
          Falta configurar R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME).
        </p>
      ) : null}

      {isEmpty ? (
        <div className="border-border bg-muted/15 flex min-h-[14rem] flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
          <Folder className="text-muted-foreground/45 mb-3 size-14" aria-hidden />
          <p className="text-foreground font-medium">Carpeta vacía</p>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            {canCreate
              ? "Crea una carpeta o sube un documento con los botones de arriba."
              : "No hay elementos visibles aquí."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {subfolders.map((f) => (
            <div
              key={f.id}
              className="border-border bg-card/70 flex flex-col rounded-2xl border p-4 shadow-sm transition-[box-shadow] hover:shadow-md"
            >
              <Link
                href={`/documentos?carpeta=${f.id}`}
                className="hover:bg-muted/35 -m-1 flex flex-1 flex-col items-center rounded-xl p-1 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Folder className="text-amber-600/90 dark:text-amber-400/95 mb-3 size-12 shrink-0 drop-shadow-sm" aria-hidden />
                <p className="text-foreground line-clamp-2 w-full text-sm font-medium leading-snug">{f.name}</p>
                <p className="text-muted-foreground mt-2 text-[0.65rem]">Carpeta</p>
                <p className="text-muted-foreground mt-1 line-clamp-2 w-full text-[0.6rem] opacity-90">
                  {policySummary({
                    uploadedByUserId: f.createdByUserId,
                    othersCanView: f.othersCanView,
                    othersCanEdit: f.othersCanEdit,
                    othersCanDelete: f.othersCanDelete,
                  })}
                </p>
              </Link>
              {(() => {
                const fm = folderRowMeta.get(f.id)!;
                if (!fm.canEdit && !fm.canDelete) return null;
                return (
                  <div className="mt-3 flex justify-center gap-1 border-t border-border/80 pt-3">
                    {fm.canEdit ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditingFolder(folderToEditState(f))}
                        aria-label={`Editar carpeta ${f.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    ) : null}
                    {fm.canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive size-8"
                        disabled={pending === `rmdir-${f.id}`}
                        onClick={() => void onDeleteFolder(f.id, f.name)}
                        aria-label={`Eliminar ${f.name}`}
                      >
                        {pending === `rmdir-${f.id}` ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          ))}

          {filesHere.map((d) => {
            const meta = rowMeta.get(d.id)!;
            const busy = pending === d.id || pending === `dl-${d.id}`;
            const displayName = d.title?.trim() || d.originalFilename;
            return (
              <div
                key={d.id}
                className="border-border bg-card/70 flex flex-col rounded-2xl border p-4 shadow-sm transition-[box-shadow] hover:shadow-md"
              >
                <div className="flex flex-1 flex-col items-center text-center">
                  <FileThumb mime={d.mimeType} filename={d.originalFilename} />
                  <p className="text-foreground mt-3 line-clamp-2 w-full text-sm font-medium leading-snug">{displayName}</p>
                  <p className="text-muted-foreground mt-1 line-clamp-1 w-full text-[0.65rem]" title={d.originalFilename}>
                    {d.originalFilename}
                  </p>
                  <p className="text-muted-foreground mt-2 text-[0.65rem]">
                    {formatBytes(d.sizeBytes)} ·{" "}
                    {new Date(d.createdAt).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-muted-foreground mt-1 line-clamp-2 w-full text-[0.6rem] opacity-90">
                    {policySummary(policyFromRow(d))}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-1 border-t border-border/80 pt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={busy || !storageReady}
                    onClick={() => void onDownload(d.id)}
                  >
                    {pending === `dl-${d.id}` ? <Loader2 className="size-3.5 animate-spin" /> : "Descargar"}
                  </Button>
                  {meta.canEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={busy}
                      onClick={() => startEditDoc(d)}
                      aria-label={`Editar ${displayName}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  ) : null}
                  {meta.canDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive size-8"
                      disabled={busy}
                      onClick={() => void onDeleteDoc(d.id)}
                      aria-label={`Eliminar ${displayName}`}
                    >
                      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        storageReady={storageReady}
        currentFolderId={currentFolderId}
        onUploaded={() => router.refresh()}
      />

      {createFolderOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={() => setCreateFolderOpen(false)} />
          <form
            onSubmit={(e) => void onCreateFolder(e)}
            className="border-border bg-card relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-xl"
          >
            <h3 className="text-foreground mb-4 text-base font-semibold">Nueva carpeta</h3>
            <Label htmlFor="new-folder-name">Nombre</Label>
            <Input
              id="new-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="mt-1.5"
              maxLength={120}
              autoFocus
              placeholder="Ej. Contratos 2026"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newFolderOthersView}
                  onChange={(e) => setNewFolderOthersView(e.target.checked)}
                  className="accent-primary"
                />
                Otros pueden ver
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newFolderOthersEdit}
                  onChange={(e) => setNewFolderOthersEdit(e.target.checked)}
                  className="accent-primary"
                />
                Otros pueden editar
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newFolderOthersDelete}
                  onChange={(e) => setNewFolderOthersDelete(e.target.checked)}
                  className="accent-primary"
                />
                Otros pueden eliminar
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCreateFolderOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending === "mkdir" || !newFolderName.trim()}>
                {pending === "mkdir" ? <Loader2 className="size-4 animate-spin" /> : "Crear"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {editingFolder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={() => setEditingFolder(null)} />
          <form
            onSubmit={(e) => void onSaveEditFolder(e)}
            className="border-border bg-card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-xl"
          >
            <h3 className="text-foreground mb-4 text-base font-semibold">Editar carpeta</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-folder-name">Nombre</Label>
                <Input
                  id="edit-folder-name"
                  value={editingFolder.name ?? ""}
                  onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                  maxLength={120}
                  autoFocus
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(editingFolder.othersCanView)}
                    onChange={(e) => setEditingFolder({ ...editingFolder, othersCanView: e.target.checked })}
                    className="accent-primary"
                  />
                  Otros pueden ver
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(editingFolder.othersCanEdit)}
                    onChange={(e) => setEditingFolder({ ...editingFolder, othersCanEdit: e.target.checked })}
                    className="accent-primary"
                  />
                  Otros pueden editar
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(editingFolder.othersCanDelete)}
                    onChange={(e) => setEditingFolder({ ...editingFolder, othersCanDelete: e.target.checked })}
                    className="accent-primary"
                  />
                  Otros pueden eliminar
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditingFolder(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending === "folder-edit"}>
                {pending === "folder-edit" ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {editingDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={() => setEditingDoc(null)} />
          <form
            onSubmit={(e) => void onSaveEditDoc(e)}
            className="border-border bg-card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-xl"
          >
            <h3 className="text-foreground mb-4 text-base font-semibold">Editar documento</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-doc-title">Título</Label>
                <Input
                  id="edit-doc-title"
                  value={editTitle ?? ""}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-doc-folder">Ubicación</Label>
                <select
                  id="edit-doc-folder"
                  value={editFolderValue ?? ROOT_FOLDER_VALUE}
                  onChange={(e) => setEditFolderValue(e.target.value)}
                  className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
                >
                  {folderOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(editOthersView)}
                    onChange={(e) => setEditOthersView(e.target.checked)}
                    className="accent-primary"
                  />
                  Otros pueden ver
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(editOthersEdit)}
                    onChange={(e) => setEditOthersEdit(e.target.checked)}
                    className="accent-primary"
                  />
                  Otros pueden editar
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(editOthersDelete)}
                    onChange={(e) => setEditOthersDelete(e.target.checked)}
                    className="accent-primary"
                  />
                  Otros pueden eliminar
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditingDoc(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending === editingDoc.id}>
                {pending === editingDoc.id ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
