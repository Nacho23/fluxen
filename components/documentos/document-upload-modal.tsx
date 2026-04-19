"use client";

import { Loader2, Upload, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  storageReady: boolean;
  /** Carpeta actual del explorador; el archivo se crea dentro de ella. */
  currentFolderId: string | null;
  onUploaded: () => void;
}>;

export function DocumentUploadModal({
  open,
  onClose,
  storageReady,
  currentFolderId,
  onUploaded,
}: Props) {
  const titleId = useId();
  const [title, setTitle] = useState("");
  const [othersView, setOthersView] = useState(true);
  const [othersEdit, setOthersEdit] = useState(true);
  const [othersDelete, setOthersDelete] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setOthersView(true);
      setOthersEdit(true);
      setOthersDelete(false);
      setFile(null);
      setError(null);
      setPending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !storageReady) return;
    setError(null);
    setPending(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title.trim());
    fd.append("othersCanView", othersView ? "true" : "false");
    fd.append("othersCanEdit", othersEdit ? "true" : "false");
    fd.append("othersCanDelete", othersDelete ? "true" : "false");
    if (currentFolderId) fd.append("folderId", currentFolderId);

    let res: Response;
    try {
      res = await fetch("/api/documentos/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
    } catch {
      setPending(false);
      setError("No se pudo contactar al servidor.");
      return;
    }

    let data: { ok?: boolean; error?: string };
    try {
      data = (await res.json()) as { ok?: boolean; error?: string };
    } catch {
      setPending(false);
      setError("Respuesta inválida del servidor.");
      return;
    }

    setPending(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? `Error (${res.status})`);
      return;
    }
    onUploaded();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="border-border bg-card relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-xl">
        <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="bg-primary/12 text-primary flex size-9 items-center justify-center rounded-xl">
              <Upload className="size-4" aria-hidden />
            </span>
            <h2 id={titleId} className="text-foreground text-base font-semibold tracking-tight">
              Subir documento
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" onClick={onClose} aria-label="Cerrar">
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-4 px-5 py-4">
            {!storageReady ? (
              <p className="text-destructive text-sm">Configura R2 en el servidor para poder subir archivos.</p>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="upload-file">Archivo</Label>
              <input
                id="upload-file"
                type="file"
                required
                disabled={pending || !storageReady}
                className="text-foreground max-w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/12 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <p className="text-muted-foreground text-xs">
                  {file.name} · {(file.size / 1024).toFixed(1)} KB
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upload-title">Título (opcional)</Label>
              <Input
                id="upload-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nombre en la biblioteca"
                maxLength={200}
                disabled={pending}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={othersView}
                  onChange={(e) => setOthersView(e.target.checked)}
                  disabled={pending}
                  className="accent-primary"
                />
                Otros pueden ver
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={othersEdit}
                  onChange={(e) => setOthersEdit(e.target.checked)}
                  disabled={pending}
                  className="accent-primary"
                />
                Otros pueden editar
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={othersDelete}
                  onChange={(e) => setOthersDelete(e.target.checked)}
                  disabled={pending}
                  className="accent-primary"
                />
                Otros pueden eliminar
              </label>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              Se combina con los permisos del rol en Documentos. Carpeta actual:{" "}
              {currentFolderId ? "dentro de la carpeta abierta" : "raíz"}.
            </p>

            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="border-border mt-auto flex flex-wrap justify-end gap-2 border-t px-5 py-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !storageReady || !file} className="gap-2">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Subiendo…
                </>
              ) : (
                "Confirmar subida"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
