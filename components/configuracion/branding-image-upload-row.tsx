"use client";

import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Kind = "cover" | "avatar";

export function BrandingImageUploadRow({
  kind,
  label,
  disabled,
  storageR2Ready,
  onUploaded,
}: Readonly<{
  kind: Kind;
  label: string;
  disabled: boolean;
  storageR2Ready: boolean;
  onUploaded: () => Promise<void> | void;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);
      const res = await fetch("/api/company-branding/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo subir la imagen");
        return;
      }
      await onUploaded();
    } catch {
      setError("Error de red al subir");
    } finally {
      setPending(false);
    }
  }

  if (!storageR2Ready) {
    return (
      <p className="text-muted-foreground text-[0.7rem] leading-relaxed">
        Para subir {label} desde tu equipo, configura las variables R2 (
        <span className="font-mono">R2_ACCOUNT_ID</span>, claves y{" "}
        <span className="font-mono">R2_BUCKET_NAME</span>) como en documentos.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        className="sr-only"
        tabIndex={-1}
        aria-label={`Seleccionar archivo para ${label}`}
        onChange={onChange}
        disabled={disabled || pending}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("gap-2", pending && "pointer-events-none opacity-80")}
        disabled={disabled || pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
        Subir Imagen
      </Button>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
