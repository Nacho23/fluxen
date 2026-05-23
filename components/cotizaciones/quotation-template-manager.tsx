"use client";

import {
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { QuotationTemplateBuilder } from "@/components/cotizaciones/quotation-template-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QuotationTemplateSummary } from "@/lib/data/quotation-templates";
import { parseQuotationTemplateLayout } from "@/lib/quotations/template-schema";
import type { SampleCustomFieldDef } from "@/lib/quotations/sample-quotation-pdf-data";
import { cn } from "@/lib/utils";
import {
  createNewQuotationTemplate,
  deleteTemplate,
  renameTemplate,
  setDefaultTemplate,
} from "@/server/actions/quotation-templates";

type CompanyPreview = {
  id: string;
  name: string;
  businessName: string | null;
  rut: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  logoHasR2: boolean;
  logoUrl: string | null;
};

type Props = Readonly<{
  templates: QuotationTemplateSummary[];
  activeTemplateId: string;
  company: CompanyPreview;
  canSave: boolean;
  customFieldDefs: SampleCustomFieldDef[];
}>;

export function QuotationTemplateManager({
  templates,
  activeTemplateId,
  company,
  canSave,
  customFieldDefs,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected template (client-side selection without navigation)
  const [selectedId, setSelectedId] = useState(activeTemplateId);
  const [templateLayouts, setTemplateLayouts] = useState<Record<string, string>>({});

  // New template form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState<string | null>(null);
  const [newPending, setNewPending] = useState(false);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  // Action errors
  const [actionError, setActionError] = useState<string | null>(null);

  const [localTemplates, setLocalTemplates] = useState<QuotationTemplateSummary[]>(templates);

  function selectTemplate(id: string) {
    setSelectedId(id);
    setActionError(null);
  }

  async function handleSetDefault(id: string) {
    setActionError(null);
    startTransition(async () => {
      const res = await setDefaultTemplate(id);
      if (!res.ok) {
        setActionError(res.error);
        return;
      }
      setLocalTemplates((prev) =>
        prev.map((t) => ({ ...t, isDefault: t.id === id })),
      );
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este formato? Esta acción no se puede deshacer.")) return;
    setActionError(null);
    startTransition(async () => {
      const res = await deleteTemplate(id);
      if (!res.ok) {
        setActionError(res.error);
        return;
      }
      const remaining = localTemplates.filter((t) => t.id !== id);
      setLocalTemplates(remaining);
      if (selectedId === id) {
        const nextDefault = remaining.find((t) => t.isDefault) ?? remaining[0];
        if (nextDefault) setSelectedId(nextDefault.id);
      }
      router.refresh();
    });
  }

  function startRename(t: QuotationTemplateSummary) {
    setRenamingId(t.id);
    setRenameValue(t.name);
    setRenameError(null);
  }

  async function handleRename(id: string) {
    setRenameError(null);
    const res = await renameTemplate(id, renameValue);
    if (!res.ok) {
      setRenameError(res.error);
      return;
    }
    setLocalTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: renameValue } : t)),
    );
    setRenamingId(null);
    router.refresh();
  }

  async function handleCreateNew() {
    setNewError(null);
    setNewPending(true);
    const res = await createNewQuotationTemplate(newName);
    setNewPending(false);
    if (!res.ok) {
      setNewError(res.error);
      return;
    }
    setShowNewForm(false);
    setNewName("");
    // Navigate to the new template
    router.push(`/configuracion/cotizaciones-formato?t=${res.templateId}`);
    router.refresh();
  }

  const selectedTemplate = localTemplates.find((t) => t.id === selectedId) ?? localTemplates[0];

  // Get a stable layout key to force-remount builder when switching templates
  const builderKey = selectedId;

  return (
    <div className="space-y-6">
      {/* Template selector bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {localTemplates.map((t) => (
            <div key={t.id} className="flex items-center gap-1">
              {renamingId === t.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleRename(t.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="h-8 w-40 text-sm"
                    maxLength={60}
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => void handleRename(t.id)}
                    disabled={!renameValue.trim()}
                  >
                    <Check className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => setRenamingId(null)}
                  >
                    <X className="size-3.5" />
                  </Button>
                  {renameError ? (
                    <span className="text-destructive text-xs">{renameError}</span>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => selectTemplate(t.id)}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors",
                    selectedId === t.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  {t.isDefault ? <Star className="size-3 fill-current" /> : null}
                  {t.name}
                  {selectedId === t.id && localTemplates.length > 1 && (
                    <ChevronDown className="size-3 opacity-60" />
                  )}
                </button>
              )}

              {/* Per-template actions (only when selected and not renaming) */}
              {selectedId === t.id && renamingId !== t.id && (
                <div className="flex items-center gap-0.5">
                  {!t.isDefault && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      title="Marcar como predeterminado"
                      onClick={() => void handleSetDefault(t.id)}
                      disabled={isPending}
                    >
                      <Star className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    title="Renombrar"
                    onClick={() => startRename(t)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  {localTemplates.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:text-destructive"
                      title="Eliminar formato"
                      onClick={() => void handleDelete(t.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* New template button / form */}
          {showNewForm ? (
            <div className="flex items-center gap-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreateNew();
                  if (e.key === "Escape") {
                    setShowNewForm(false);
                    setNewName("");
                  }
                }}
                placeholder="Nombre del formato"
                className="h-8 w-44 text-sm"
                maxLength={60}
                autoFocus
              />
              <Button
                size="sm"
                className="h-8"
                onClick={() => void handleCreateNew()}
                disabled={!newName.trim() || newPending}
              >
                {newPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Crear
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => {
                  setShowNewForm(false);
                  setNewName("");
                  setNewError(null);
                }}
              >
                <X className="size-3.5" />
              </Button>
              {newError ? <span className="text-destructive text-xs">{newError}</span> : null}
            </div>
          ) : (
            canSave && (
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="size-3.5" />
                Nuevo formato
              </Button>
            )
          )}
        </div>

        {/* Status badge */}
        {selectedTemplate && (
          <p className="text-muted-foreground text-xs">
            {selectedTemplate.isDefault ? (
              <span className="text-foreground font-medium">Predeterminado</span>
            ) : (
              <span>
                No es el predeterminado —{" "}
                <button
                  type="button"
                  className="underline underline-offset-2 hover:no-underline"
                  onClick={() => void handleSetDefault(selectedTemplate.id)}
                  disabled={isPending}
                >
                  marcar como predeterminado
                </button>
              </span>
            )}
            {" · "}
            Editando: <span className="text-foreground font-medium">{selectedTemplate.name}</span>
          </p>
        )}

        {actionError ? (
          <p className="text-destructive text-sm" role="alert">
            {actionError}
          </p>
        ) : null}

        {isPending ? (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Loader2 className="size-3 animate-spin" />
            Actualizando…
          </p>
        ) : null}
      </div>

      {/* Builder for the selected template */}
      {selectedTemplate ? (
        <TemplateBuilderLoader
          key={builderKey}
          templateId={selectedTemplate.id}
          company={company}
          canSave={canSave}
          customFieldDefs={customFieldDefs}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loader: fetches the full layout for the selected template via server action
// and renders the builder
// ---------------------------------------------------------------------------

import { useEffect } from "react";
import { getQuotationTemplateForBuilder } from "@/server/actions/quotation-templates";
import type { QuotationTemplateLayout } from "@/lib/quotations/template-schema";

function TemplateBuilderLoader({
  templateId,
  company,
  canSave,
  customFieldDefs,
}: Readonly<{
  templateId: string;
  company: CompanyPreview;
  canSave: boolean;
  customFieldDefs: SampleCustomFieldDef[];
}>) {
  const [layout, setLayout] = useState<QuotationTemplateLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getQuotationTemplateForBuilder(templateId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      try {
        setLayout(parseQuotationTemplateLayout(JSON.parse(res.layoutJson)));
      } catch {
        setError("No se pudo cargar el formato");
      }
    });
    return () => { cancelled = true; };
  }, [templateId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando formato…
      </div>
    );
  }

  if (error || !layout) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {error ?? "No se pudo cargar el formato"}
      </p>
    );
  }

  return (
    <QuotationTemplateBuilder
      templateId={templateId}
      initialLayout={layout}
      company={company}
      canSave={canSave}
      customFieldDefs={customFieldDefs}
    />
  );
}
