"use client";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Italic,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { QuotationTemplatePreview } from "@/components/cotizaciones/quotation-template-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchCompanyLogoDataUrl } from "@/lib/branding/fetch-company-logo-data-url";
import { buildSampleQuotationPdfData } from "@/lib/quotations/sample-quotation-pdf-data";
import {
  ALIGN_OPTIONS,
  BODY_ALIGN_OPTIONS,
  addCustomSection,
  getBlockLabel,
  isCustomSectionId,
  moveBlock,
  removeCustomSection,
  toggleBlock,
  updateCustomSection,
  type BodyTextAlign,
  type CustomSectionFieldRef,
  type QuotationCustomSection,
  type SignatureRow,
  type TextAlign,
  type QuotationTemplateLayout,
} from "@/lib/quotations/template-schema";
import type { SampleCustomFieldDef } from "@/lib/quotations/sample-quotation-pdf-data";
import { cn } from "@/lib/utils";
import { saveQuotationTemplate } from "@/server/actions/quotation-templates";

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

function FieldToggle({
  id,
  label,
  checked,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}>) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-sm",
        checked ? "border-primary/40 bg-primary/5" : "border-border bg-background",
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="size-3.5 rounded border"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

const ALIGN_ICONS = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
} as const;

const BODY_ALIGN_ICONS = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
  justify: AlignJustify,
} as const;

const BODY_ALIGN_LABELS: Record<BodyTextAlign, string> = {
  left: "Izquierda",
  center: "Centro",
  right: "Derecha",
  justify: "Justificado",
};

function AlignPicker({
  value,
  onChange,
}: Readonly<{ value: TextAlign; onChange: (v: TextAlign) => void }>) {
  return (
    <div className="flex gap-1">
      {ALIGN_OPTIONS.map((opt) => {
        const Icon = ALIGN_ICONS[opt];
        return (
          <button
            key={opt}
            type="button"
            title={{ left: "Izquierda", center: "Centro", right: "Derecha" }[opt]}
            className={cn(
              "flex size-8 items-center justify-center rounded border",
              value === opt
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onChange(opt)}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

function BodyAlignPicker({
  value,
  onChange,
}: Readonly<{ value: BodyTextAlign; onChange: (v: BodyTextAlign) => void }>) {
  return (
    <div className="flex gap-1">
      {BODY_ALIGN_OPTIONS.map((opt) => {
        const Icon = BODY_ALIGN_ICONS[opt];
        return (
          <button
            key={opt}
            type="button"
            title={BODY_ALIGN_LABELS[opt]}
            className={cn(
              "flex size-8 items-center justify-center rounded border",
              value === opt
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onChange(opt)}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

function TextStyleRow({
  label,
  align,
  onAlignChange,
  size,
  onSizeChange,
  sizeMin,
  sizeMax,
  bold,
  onBoldChange,
}: Readonly<{
  label: string;
  align: TextAlign;
  onAlignChange: (v: TextAlign) => void;
  size: number;
  onSizeChange: (v: number) => void;
  sizeMin: number;
  sizeMax: number;
  bold: boolean;
  onBoldChange: (v: boolean) => void;
}>) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <AlignPicker value={align} onChange={onAlignChange} />
        <div className="flex items-center gap-1">
          <Label htmlFor={`size-${label}`} className="sr-only">
            Tamaño
          </Label>
          <input
            id={`size-${label}`}
            type="number"
            min={sizeMin}
            max={sizeMax}
            value={size}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v) && v >= sizeMin && v <= sizeMax) onSizeChange(v);
            }}
            className="border-input bg-background h-8 w-16 rounded border px-2 text-center text-sm tabular-nums"
            title="Tamaño de fuente (pt)"
          />
          <span className="text-muted-foreground text-xs">pt</span>
        </div>
        <button
          type="button"
          title="Negrita"
          className={cn(
            "flex size-8 items-center justify-center rounded border",
            bold
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onBoldChange(!bold)}
        >
          <Bold className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function TextareaField({
  id,
  label,
  value,
  maxLength,
  hint,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  maxLength?: number;
  hint?: string;
  onChange: (v: string) => void;
}>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="text-muted-foreground text-[0.7rem]">{hint}</p> : null}
    </div>
  );
}

function BlockSettings({
  layout,
  blockId,
  onChange,
  onRemoveCustom,
  customFieldDefs,
}: Readonly<{
  layout: QuotationTemplateLayout;
  blockId: string;
  onChange: (next: QuotationTemplateLayout) => void;
  onRemoveCustom?: (id: string) => void;
  customFieldDefs: SampleCustomFieldDef[];
}>) {
  // Sección personalizada
  if (isCustomSectionId(blockId)) {
    const maybeSection = layout.customSections.find((s) => s.id === blockId);
    if (!maybeSection) return null;
    const section = maybeSection;

    function patchSection(patch: Partial<Omit<QuotationCustomSection, "id">>) {
      onChange(updateCustomSection(layout, blockId, patch));
    }

    function addFieldRef(fieldId: string) {
      const fieldDef = customFieldDefs.find((f) => f.id === fieldId);
      const newRef: CustomSectionFieldRef = {
        id: `ref_${Date.now().toString(36)}`,
        fieldId,
        align: "left",
        size: 9,
        bold: false,
      };
      const patch: Partial<Omit<QuotationCustomSection, "id">> = {
        fieldRefs: [...section.fieldRefs, newRef],
      };
      if (!section.title.trim() && fieldDef?.label.trim()) {
        patch.title = fieldDef.label.trim();
      }
      patchSection(patch);
    }

    function updateFieldRef(refId: string, patch: Partial<CustomSectionFieldRef>) {
      patchSection({
        fieldRefs: section.fieldRefs.map((r) => (r.id === refId ? { ...r, ...patch } : r)),
      });
    }

    function removeFieldRef(refId: string) {
      patchSection({ fieldRefs: section.fieldRefs.filter((r) => r.id !== refId) });
    }

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor={`cs-title-${blockId}`}>Título de la sección</Label>
          <Input
            id={`cs-title-${blockId}`}
            value={section.title}
            maxLength={60}
            onChange={(e) => patchSection({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Párrafo de texto
          </p>
          <textarea
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            value={section.body}
            maxLength={3000}
            onChange={(e) => patchSection({ body: e.target.value })}
          />
          <p className="text-muted-foreground text-[0.7rem]">
            Listas: una línea por ítem con <code className="text-xs">-</code>,{" "}
            <code className="text-xs">*</code> o <code className="text-xs">•</code> para viñetas, o{" "}
            <code className="text-xs">1.</code> / <code className="text-xs">2.</code> para numeradas.
            Indenta con 2 espacios (o tab) para sub-viñetas. Línea en blanco separa bloques.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <BodyAlignPicker
              value={section.bodyAlign}
              onChange={(v) => patchSection({ bodyAlign: v })}
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={7}
                max={20}
                value={section.bodySize}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v) && v >= 7 && v <= 20) patchSection({ bodySize: v });
                }}
                className="border-input bg-background h-8 w-14 rounded border px-2 text-center text-sm tabular-nums"
                title="Tamaño (pt)"
              />
              <span className="text-muted-foreground text-xs">pt</span>
            </div>
            <button
              type="button"
              title="Negrita"
              className={cn(
                "flex size-8 items-center justify-center rounded border",
                section.bodyBold
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              onClick={() => patchSection({ bodyBold: !section.bodyBold })}
            >
              <Bold className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Campos personalizados embebidos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Campos personalizados
            </p>
          </div>
          {customFieldDefs.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No hay campos personalizados definidos para esta empresa.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-[0.7rem]">
                El valor del campo admite listas con <code className="text-xs">-</code> o{" "}
                <code className="text-xs">1.</code> (indenta para sub-viñetas), igual que el párrafo
                de arriba.
              </p>
              <div className="flex gap-2">
                <select
                  id={`cs-field-pick-${blockId}`}
                  className="border-input bg-background h-9 min-w-0 flex-1 rounded border px-2 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addFieldRef(e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>
                    Selecciona un campo…
                  </option>
                  {customFieldDefs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sel = document.getElementById(
                      `cs-field-pick-${blockId}`,
                    ) as HTMLSelectElement | null;
                    if (sel?.value) {
                      addFieldRef(sel.value);
                      sel.value = "";
                    }
                  }}
                >
                  <Plus className="size-3.5" />
                  Agregar
                </Button>
              </div>
              {section.fieldRefs.map((ref) => {
                const fieldDef = customFieldDefs.find((f) => f.id === ref.fieldId);
                return (
                  <div key={ref.id} className="border-border rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate" title="Referencia interna">
                        {fieldDef?.label ?? ref.fieldId}
                        <span className="text-muted-foreground font-normal"> · valor en PDF</span>
                      </span>
                      <button
                        type="button"
                        className="text-destructive border-border rounded border p-1.5 shrink-0"
                        title="Quitar campo"
                        onClick={() => removeFieldRef(ref.id)}
                      >
                        <Trash2 className="size-3" aria-hidden />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <BodyAlignPicker
                        value={ref.align}
                        onChange={(v) => updateFieldRef(ref.id, { align: v })}
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={7}
                          max={20}
                          value={ref.size}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isNaN(v) && v >= 7 && v <= 20)
                              updateFieldRef(ref.id, { size: v });
                          }}
                          className="border-input bg-background h-8 w-14 rounded border px-2 text-center text-sm tabular-nums"
                          title="Tamaño (pt)"
                        />
                        <span className="text-muted-foreground text-xs">pt</span>
                      </div>
                      <button
                        type="button"
                        title="Negrita"
                        className={cn(
                          "flex size-8 items-center justify-center rounded border",
                          ref.bold
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => updateFieldRef(ref.id, { bold: !ref.bold })}
                      >
                        <Bold className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {onRemoveCustom ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive w-full"
            onClick={() => onRemoveCustom(blockId)}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Eliminar sección
          </Button>
        ) : null}
      </div>
    );
  }

  switch (blockId) {
    case "quote_meta":
      return (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="documentTitle">Texto del título</Label>
            <Input
              id="documentTitle"
              value={layout.documentTitle}
              onChange={(e) => onChange({ ...layout, documentTitle: e.target.value })}
              maxLength={80}
            />
            <p className="text-muted-foreground text-[0.7rem]">
              Se muestra junto al número: «Cotización COT-00042».
            </p>
          </div>
          <TextStyleRow
            label="Número y título"
            align={layout.quoteMeta.titleAlign}
            onAlignChange={(v) =>
              onChange({ ...layout, quoteMeta: { ...layout.quoteMeta, titleAlign: v } })
            }
            size={layout.quoteMeta.titleSize}
            onSizeChange={(v) =>
              onChange({ ...layout, quoteMeta: { ...layout.quoteMeta, titleSize: v } })
            }
            sizeMin={10}
            sizeMax={40}
            bold={layout.quoteMeta.titleBold}
            onBoldChange={(v) =>
              onChange({ ...layout, quoteMeta: { ...layout.quoteMeta, titleBold: v } })
            }
          />
          <div className="border-border border-t pt-4">
            <p className="text-muted-foreground mb-3 text-[0.7rem] leading-relaxed">
              <strong className="text-foreground">Título de la cotización</strong> — texto opcional
              que se agrega al crear cada cotización. Si está definido, aparece debajo del número.
            </p>
            <TextStyleRow
              label="Título de la cotización"
              align={layout.quoteMeta.subtitleAlign}
              onAlignChange={(v) =>
                onChange({ ...layout, quoteMeta: { ...layout.quoteMeta, subtitleAlign: v } })
              }
              size={layout.quoteMeta.subtitleSize}
              onSizeChange={(v) =>
                onChange({ ...layout, quoteMeta: { ...layout.quoteMeta, subtitleSize: v } })
              }
              sizeMin={8}
              sizeMax={32}
              bold={layout.quoteMeta.subtitleBold}
              onBoldChange={(v) =>
                onChange({ ...layout, quoteMeta: { ...layout.quoteMeta, subtitleBold: v } })
              }
            />
          </div>
        </div>
      );

    case "company":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["showLogo", "Mostrar logo"],
              ["showName", "Nombre comercial"],
              ["showBusinessName", "Razón social"],
              ["showRut", "RUT"],
              ["showAddress", "Dirección"],
              ["showCityCountry", "Ciudad / país"],
              ["showPhone", "Teléfono"],
              ["showEmail", "Correo"],
              ["showWebsite", "Sitio web"],
            ] as const
          ).map(([key, label]) => (
            <FieldToggle
              key={key}
              id={`co-${key}`}
              label={label}
              checked={layout.company[key]}
              onChange={(v) => onChange({ ...layout, company: { ...layout.company, [key]: v } })}
            />
          ))}
        </div>
      );

    case "client": {
      const fields = [
        {
          showKey: "showName" as const,
          labelKey: "labelName" as const,
          showLabelKey: "showLabelName" as const,
          caption: "Nombre / empresa",
        },
        {
          showKey: "showEmail" as const,
          labelKey: "labelEmail" as const,
          showLabelKey: "showLabelEmail" as const,
          caption: "Correo",
        },
        {
          showKey: "showPhone" as const,
          labelKey: "labelPhone" as const,
          showLabelKey: "showLabelPhone" as const,
          caption: "Teléfono",
        },
        {
          showKey: "showServiceDate" as const,
          labelKey: "labelServiceDate" as const,
          showLabelKey: "showLabelServiceDate" as const,
          caption: "Fecha del servicio",
        },
        {
          showKey: "showNotes" as const,
          labelKey: "labelNotes" as const,
          showLabelKey: "showLabelNotes" as const,
          caption: "Notas adicionales",
        },
      ];
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="clientSection">Título de sección</Label>
            <Input
              id="clientSection"
              value={layout.client.sectionTitle}
              onChange={(e) =>
                onChange({ ...layout, client: { ...layout.client, sectionTitle: e.target.value } })
              }
            />
          </div>
          <div className="space-y-3">
            {fields.map(({ showKey, labelKey, showLabelKey, caption }) => (
              <div
                key={showKey}
                className="border-border rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{caption}</span>
                  <FieldToggle
                    id={`cl-${showKey}`}
                    label="Mostrar campo"
                    checked={layout.client[showKey]}
                    onChange={(v) =>
                      onChange({ ...layout, client: { ...layout.client, [showKey]: v } })
                    }
                  />
                </div>
                {layout.client[showKey] ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`cl-lbl-${labelKey}`} className="text-xs">Texto etiqueta (opcional)</Label>
                      <Input
                        id={`cl-lbl-${labelKey}`}
                        value={layout.client[labelKey]}
                        maxLength={40}
                        placeholder="Vacío = solo reserva espacio"
                        onChange={(e) =>
                          onChange({ ...layout, client: { ...layout.client, [labelKey]: e.target.value } })
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <FieldToggle
                        id={`cl-slbl-${showLabelKey}`}
                        label="Mostrar etiqueta"
                        checked={layout.client[showLabelKey]}
                        onChange={(v) =>
                          onChange({ ...layout, client: { ...layout.client, [showLabelKey]: v } })
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "custom_fields":
      return (
        <div className="space-y-1.5">
          <Label htmlFor="cfSection">Título de sección</Label>
          <Input
            id="cfSection"
            value={layout.customFields.sectionTitle}
            onChange={(e) =>
              onChange({ ...layout, customFields: { sectionTitle: e.target.value } })
            }
          />
          <p className="text-muted-foreground text-[0.7rem]">
            Solo aparece si la cotización tiene campos personalizados con valor.
          </p>
        </div>
      );

    case "lines":
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="linesSectionTitle">Título de la sección</Label>
            <Input
              id="linesSectionTitle"
              value={layout.lines.sectionTitle}
              maxLength={60}
              onChange={(e) =>
                onChange({
                  ...layout,
                  lines: { ...layout.lines, sectionTitle: e.target.value },
                })
              }
            />
            <p className="text-muted-foreground text-[0.7rem]">
              Encabezado sobre la tabla de ítems (color de acento).
            </p>
          </div>
          <FieldToggle
            id="showType"
            label="Columna «Tipo»"
            checked={layout.lines.showTypeColumn}
            onChange={(v) =>
              onChange({ ...layout, lines: { ...layout.lines, showTypeColumn: v } })
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["labelDescription", "Descripción"],
                ["labelType", "Tipo"],
                ["labelQuantity", "Cantidad"],
                ["labelUnitPrice", "Precio unit."],
                ["labelLineTotal", "Total línea"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={layout.lines[key]}
                  maxLength={30}
                  onChange={(e) =>
                    onChange({ ...layout, lines: { ...layout.lines, [key]: e.target.value } })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      );

    case "totals":
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["labelSubtotal", "Subtotal"],
              ["labelDiscount", "Descuento"],
              ["labelVat", "IVA (19%)"],
              ["labelVatIncluded", "Nota IVA incluido"],
              ["labelTotal", "Total"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={layout.totals[key]}
                maxLength={30}
                onChange={(e) =>
                  onChange({ ...layout, totals: { ...layout.totals, [key]: e.target.value } })
                }
              />
            </div>
          ))}
        </div>
      );

    case "terms":
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="termsSectionTitle">Título de sección</Label>
            <Input
              id="termsSectionTitle"
              value={layout.terms.sectionTitle}
              maxLength={60}
              onChange={(e) =>
                onChange({ ...layout, terms: { ...layout.terms, sectionTitle: e.target.value } })
              }
            />
          </div>
          <TextareaField
            id="termsBody"
            label="Texto"
            value={layout.terms.body}
            maxLength={3000}
            onChange={(v) => onChange({ ...layout, terms: { ...layout.terms, body: v } })}
          />
          <p className="text-muted-foreground text-[0.7rem]">
            El bloque solo aparece en el PDF si tiene contenido.
          </p>
        </div>
      );

    case "footer":
      return (
        <div className="space-y-4">
          <FieldToggle
            id="showBody"
            label="Mostrar texto del pie"
            checked={layout.footer.showBody}
            onChange={(v) =>
              onChange({ ...layout, footer: { ...layout.footer, showBody: v } })
            }
          />
          {layout.footer.showBody ? (
            <div className="space-y-1.5">
              <Label htmlFor="footerBody">Texto del pie</Label>
              <Input
                id="footerBody"
                value={layout.footer.body}
                maxLength={500}
                onChange={(e) =>
                  onChange({ ...layout, footer: { ...layout.footer, body: e.target.value } })
                }
              />
              <p className="text-muted-foreground text-[0.7rem]">
                Usa {"{number}"} para insertar el N° de cotización.
              </p>
            </div>
          ) : null}
          <FieldToggle
            id="showPageNumber"
            label="Mostrar número de página (Pág. 1 de 2)"
            checked={layout.footer.showPageNumber}
            onChange={(v) =>
              onChange({ ...layout, footer: { ...layout.footer, showPageNumber: v } })
            }
          />
          {layout.footer.showBody && layout.footer.showPageNumber ? (
            <div className="space-y-1.5">
              <Label>Distribución</Label>
              <div className="flex gap-2">
                {(
                  [
                    ["center", "Centrado"],
                    ["justify", "Texto izq. · N° pág. der."],
                  ] as const
                ).map(([val, lbl]) => (
                  <button
                    key={val}
                    type="button"
                    className={cn(
                      "flex-1 rounded border px-3 py-2 text-sm",
                      layout.footer.distribution === val
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() =>
                      onChange({ ...layout, footer: { ...layout.footer, distribution: val } })
                    }
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      );

    case "signature": {
      const sig = layout.signature;
      function updateSigRow(i: number, patch: Partial<SignatureRow>) {
        const rows = sig.rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
        onChange({ ...layout, signature: { ...sig, rows } });
      }
      function addSigRow() {
        onChange({
          ...layout,
          signature: {
            ...sig,
            rows: [...sig.rows, { text: "", size: 10, bold: false, italic: false }],
          },
        });
      }
      function removeSigRow(i: number) {
        onChange({
          ...layout,
          signature: {
            ...sig,
            rows: sig.rows.filter((_, idx) => idx !== i),
          },
        });
      }
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Alineación de la firma</Label>
            <AlignPicker
              value={sig.align}
              onChange={(v) => onChange({ ...layout, signature: { ...sig, align: v } })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Filas</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSigRow}
              >
                <Plus className="size-3.5" aria-hidden />
                Agregar fila
              </Button>
            </div>
            {sig.rows.map((row, i) => (
              <div key={i} className="border-border rounded-lg border p-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={row.text}
                    maxLength={200}
                    placeholder="Texto de la fila…"
                    onChange={(e) => updateSigRow(i, { text: e.target.value })}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    className="text-destructive hover:text-destructive border-border rounded border p-2"
                    title="Eliminar fila"
                    onClick={() => removeSigRow(i)}
                    disabled={sig.rows.length <= 1}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={7}
                      max={28}
                      value={row.size}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v) && v >= 7 && v <= 28) updateSigRow(i, { size: v });
                      }}
                      className="border-input bg-background h-8 w-14 rounded border px-2 text-center text-sm tabular-nums"
                      title="Tamaño (pt)"
                    />
                    <span className="text-muted-foreground text-xs">pt</span>
                  </div>
                  <button
                    type="button"
                    title="Negrita"
                    className={cn(
                      "flex size-8 items-center justify-center rounded border",
                      row.bold
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => updateSigRow(i, { bold: !row.bold })}
                  >
                    <Bold className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    title="Cursiva"
                    className={cn(
                      "flex size-8 items-center justify-center rounded border",
                      row.italic
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => updateSigRow(i, { italic: !row.italic })}
                  >
                    <Italic className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return (
        <p className="text-muted-foreground text-sm">
          Selecciona un bloque para editar sus opciones.
        </p>
      );
  }
}

export function QuotationTemplateBuilder({
  templateId,
  initialLayout,
  company,
  canSave,
  customFieldDefs,
}: Readonly<{
  templateId: string;
  initialLayout: QuotationTemplateLayout;
  company: CompanyPreview;
  canSave: boolean;
  customFieldDefs: SampleCustomFieldDef[];
}>) {
  const router = useRouter();

  // layout: estado editable en tiempo real
  const [layout, setLayout] = useState(initialLayout);
  // previewLayout: sólo se actualiza al pulsar "Actualizar vista previa"
  const [previewLayout, setPreviewLayout] = useState(initialLayout);

  const [selectedId, setSelectedId] = useState<string>("company");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const hasLogoSource = company.logoHasR2 || Boolean(company.logoUrl?.trim());

  useEffect(() => {
    if (!previewLayout.company.showLogo || !hasLogoSource) {
      setLogoDataUrl(null);
      return;
    }
    let cancelled = false;
    void fetchCompanyLogoDataUrl(company.id, company.logoHasR2, company.logoUrl).then((url) => {
      if (!cancelled) setLogoDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [
    company.id,
    company.logoHasR2,
    company.logoUrl,
    hasLogoSource,
    previewLayout.company.showLogo,
  ]);

  const previewData = useMemo(
    () =>
      buildSampleQuotationPdfData(
        { ...company, logoUrl: previewLayout.company.showLogo ? logoDataUrl : null },
        customFieldDefs,
      ),
    [company, customFieldDefs, previewLayout.company.showLogo, logoDataUrl],
  );

  const previewLayoutKey = JSON.stringify(previewLayout);
  const layoutKey = JSON.stringify(layout);
  const isStale = previewLayoutKey !== layoutKey;

  function handleRefreshPreview() {
    setPreviewLayout(layout);
  }

  async function onSave() {
    if (!canSave) return;
    setError(null);
    setSaved(false);
    setPending(true);
    const res = await saveQuotationTemplate(templateId, JSON.stringify(layout));
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  function handleAddCustomSection() {
    const next = addCustomSection(layout);
    const newBlock = next.blocks[next.blocks.length - 1];
    setLayout(next);
    if (newBlock) setSelectedId(newBlock.id);
  }

  function handleRemoveCustomSection(id: string) {
    if (!confirm("¿Eliminar esta sección? Esta acción no se puede deshacer.")) return;
    const next = removeCustomSection(layout, id);
    setLayout(next);
    if (selectedId === id) setSelectedId("company");
  }

  const selectedBlock = layout.blocks.find((b) => b.id === selectedId);
  const selectedLabel = getBlockLabel(layout, selectedId);

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status">
          Formato guardado correctamente.
        </p>
      ) : null}

      {/* Barra superior: color + acciones */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="accentColor">Color de acento</Label>
          <div className="flex items-center gap-2">
            <input
              id="accentColor"
              type="color"
              value={layout.accentColor}
              className="border-border size-10 cursor-pointer rounded border p-0.5"
              onChange={(e) => setLayout({ ...layout, accentColor: e.target.value })}
            />
            <Input
              value={layout.accentColor}
              className="w-28 font-mono text-xs"
              maxLength={7}
              onChange={(e) => setLayout({ ...layout, accentColor: e.target.value })}
            />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {canSave ? (
            <Button type="button" onClick={onSave} disabled={pending} variant="default">
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              Guardar formato
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm">
              Solo el propietario puede guardar.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,340px)_1fr]">
        {/* Columna izquierda: lista de bloques + ajustes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Bloques del PDF</h2>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                Ordena y activa secciones.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomSection}
              className="shrink-0"
            >
              <Plus className="size-3.5" aria-hidden />
              Nueva sección
            </Button>
          </div>

          <ul className="space-y-1.5">
            {layout.blocks.map((block, index) => {
              const isSelected = block.id === selectedId;
              const label = getBlockLabel(layout, block.id);
              return (
                <li key={block.id}>
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-lg border p-1",
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card",
                      !block.enabled && "opacity-55",
                    )}
                  >
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground flex flex-col p-0.5 disabled:opacity-30"
                      aria-label={`Subir ${label}`}
                      disabled={index === 0}
                      onClick={() => setLayout(moveBlock(layout, block.id, "up"))}
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground flex flex-col p-0.5 disabled:opacity-30"
                      aria-label={`Bajar ${label}`}
                      disabled={index === layout.blocks.length - 1}
                      onClick={() => setLayout(moveBlock(layout, block.id, "down"))}
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="min-w-0 flex-1 px-1 py-1.5 text-left text-sm font-medium"
                      onClick={() => setSelectedId(block.id)}
                    >
                      <span className="block truncate">{label}</span>
                      {isCustomSectionId(block.id) ? (
                        <span className="text-muted-foreground text-[0.65rem]">
                          Sección personalizada
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground p-1.5"
                      title={block.enabled ? "Ocultar bloque" : "Mostrar bloque"}
                      onClick={() => setLayout(toggleBlock(layout, block.id, !block.enabled))}
                    >
                      {block.enabled ? (
                        <Eye className="size-4" aria-hidden />
                      ) : (
                        <EyeOff className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Panel de ajustes del bloque seleccionado */}
          <div className="border-border rounded-xl border p-4">
            <h3 className="mb-3 text-sm font-semibold">
              {selectedLabel}
              {selectedBlock && !selectedBlock.enabled ? (
                <span className="text-muted-foreground ml-2 text-xs font-normal">(oculto)</span>
              ) : null}
            </h3>
            <BlockSettings
              layout={layout}
              blockId={selectedId}
              onChange={setLayout}
              onRemoveCustom={handleRemoveCustomSection}
              customFieldDefs={customFieldDefs}
            />
          </div>
        </div>

        {/* Columna derecha: vista previa */}
        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Vista previa</h2>
              <p className="text-muted-foreground text-xs">
                Datos de ejemplo. Actualiza manualmente para ver los cambios.
              </p>
            </div>
            <Button
              type="button"
              variant={isStale ? "default" : "outline"}
              size="sm"
              onClick={handleRefreshPreview}
              className="shrink-0"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              {isStale ? "Actualizar vista previa" : "Vista previa al día"}
            </Button>
          </div>
          {isStale ? (
            <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs">
              Hay cambios sin aplicar en la vista previa. Pulsa «Actualizar vista previa» para verlos reflejados.
            </p>
          ) : null}
          <QuotationTemplatePreview layout={previewLayout} data={previewData} />
        </div>
      </div>
    </div>
  );
}
