"use client";

import { Check, ChevronDown, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import { useMemo, useState, useTransition } from "react";

import { ClientFormModal } from "@/components/clientes/client-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLIENT_KIND_LABEL } from "@/lib/data/client-kind";
import type { ClientRow } from "@/lib/data/company-clients";
import type { ServiceRow } from "@/lib/data/company-services";
import type { QuotationCustomFieldRow } from "@/lib/data/quotation-custom-fields-public";
import { SERVICE_ITEM_TYPE_LABEL } from "@/lib/data/service-item-type";
import { previewLineTotal, previewQuotationTotals } from "@/lib/quotations/preview-totals";
import { cn } from "@/lib/utils";
import { createQuotation, updateQuotation } from "@/server/actions/quotations";
import { QuoteDiscountMode } from "@/lib/prisma/enums-public";

const priceFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function todayLocalISO(): string {
  const z = new Date();
  const y = z.getFullYear();
  const m = String(z.getMonth() + 1).padStart(2, "0");
  const day = String(z.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDecimalInput(s: string): number | null {
  const t = s.replace(",", ".").trim();
  if (t === "") return null;
  const n = Number(t);
  if (Number.isNaN(n)) return null;
  return n;
}

type DraftLine = {
  key: string;
  serviceId: string | null;
  name: string;
  description: string;
  itemType: "" | "SERVICIO" | "PRODUCTO";
  unitPrice: string;
  quantity: string;
};

/** `lineKey` fijo en la línea inicial evita desajuste de hidratación (SSR vs cliente con `randomUUID`). */
function createEmptyLine(lineKey?: string): DraftLine {
  return {
    key: lineKey ?? crypto.randomUUID(),
    serviceId: null,
    name: "",
    description: "",
    itemType: "",
    unitPrice: "",
    quantity: "1",
  };
}

function formatClientOptionLabel(c: ClientRow): string {
  return c.email ? `${c.name} · ${c.email}` : c.name;
}

function clientMatchesSearch(c: ClientRow, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const parts = [c.name, c.email, c.phone, c.rut].filter(Boolean) as string[];
  return parts.some((p) => p.toLowerCase().includes(q));
}

function lineFromService(s: ServiceRow): DraftLine {
  const price =
    s.defaultPrice != null && s.defaultPrice !== ""
      ? String(s.defaultPrice).replace(".", ",")
      : "";
  return {
    key: crypto.randomUUID(),
    serviceId: s.id,
    name: s.name,
    description: s.description ?? "",
    itemType: s.itemType ?? "",
    unitPrice: price,
    quantity: "1",
  };
}

export type QuotationFormInitialData = {
  quotationId: string;
  serviceDate: string;
  clientId: string;
  title: string;
  templateId: string | null;
  discountMode: QuoteDiscountMode;
  discountValue: string;
  vatChargedSeparately: boolean;
  lines: DraftLine[];
  customValues: Record<string, string>;
};

export type TemplateSummary = {
  id: string;
  name: string;
  isDefault: boolean;
};

export function NewQuotationForm({
  catalogServices,
  initialClients,
  canCreateClient,
  customFields,
  initialData,
  templates,
}: Readonly<{
  catalogServices: ServiceRow[];
  initialClients: ClientRow[];
  canCreateClient: boolean;
  customFields: QuotationCustomFieldRow[];
  initialData?: QuotationFormInitialData;
  templates?: TemplateSummary[];
}>) {
  const isEditing = Boolean(initialData?.quotationId);

  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [serviceDate, setServiceDate] = useState(() => initialData?.serviceDate ?? todayLocalISO());
  const [title, setTitle] = useState(() => initialData?.title ?? "");
  const defaultTemplateId = templates?.find((t) => t.isDefault)?.id ?? templates?.[0]?.id ?? null;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    () => initialData?.templateId ?? defaultTemplateId,
  );
  const effectiveTemplateId = useMemo(() => {
    if (!templates?.length) return selectedTemplateId;
    if (selectedTemplateId && templates.some((t) => t.id === selectedTemplateId)) {
      return selectedTemplateId;
    }
    return defaultTemplateId;
  }, [templates, selectedTemplateId, defaultTemplateId]);
  const [selectedClientId, setSelectedClientId] = useState(() => initialData?.clientId ?? "");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [discountMode, setDiscountMode] = useState<QuoteDiscountMode>(
    () => initialData?.discountMode ?? "NONE",
  );
  const [discountValue, setDiscountValue] = useState(() => initialData?.discountValue ?? "");
  const [vatChargedSeparately, setVatChargedSeparately] = useState(
    () => initialData?.vatChargedSeparately ?? false,
  );
  const [lines, setLines] = useState<DraftLine[]>(
    () => initialData?.lines ?? [createEmptyLine("draft-line-0")],
  );

  const [customValues, setCustomValues] = useState<Record<string, string>>(
    () =>
      initialData?.customValues ??
      Object.fromEntries(customFields.map((f) => [f.id, ""])),
  );

  const [catalogPick, setCatalogPick] = useState("");
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  const selectedClient = useMemo(
    () => initialClients.find((c) => c.id === selectedClientId),
    [initialClients, selectedClientId],
  );

  const filteredClients = useMemo(
    () => initialClients.filter((c) => clientMatchesSearch(c, clientSearch)),
    [initialClients, clientSearch],
  );

  const filteredServices = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return catalogServices;
    return catalogServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false),
    );
  }, [catalogServices, catalogSearch]);

  const selectedCatalogService = useMemo(
    () => catalogServices.find((s) => s.id === catalogPick) ?? null,
    [catalogServices, catalogPick],
  );

  const preview = useMemo(() => {
    const lineTotals: number[] = [];
    for (const line of lines) {
      const up = parseDecimalInput(line.unitPrice);
      const q = parseDecimalInput(line.quantity);
      if (up == null || q == null) {
        lineTotals.push(0);
      } else {
        lineTotals.push(previewLineTotal(up, q));
      }
    }
    let dv: number | null = null;
    if (discountMode !== "NONE") {
      const parsed = parseDecimalInput(discountValue);
      dv = parsed ?? 0;
    }
    return previewQuotationTotals(lineTotals, discountMode, dv, vatChargedSeparately);
  }, [lines, discountMode, discountValue, vatChargedSeparately]);

  function addEmptyLine() {
    setLines((prev) => [...prev, createEmptyLine()]);
  }

  function addFromCatalog() {
    if (!catalogPick) return;
    const s = catalogServices.find((x) => x.id === catalogPick);
    if (!s) return;
    setLines((prev) => [...prev, lineFromService(s)]);
    setCatalogPick("");
    setCatalogSearch("");
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedLines: {
      serviceId: string | null;
      name: string;
      description: string | null;
      itemType?: "SERVICIO" | "PRODUCTO";
      unitPrice: number;
      quantity: number;
    }[] = [];

    for (const line of lines) {
      const name = line.name.trim();
      if (!name) {
        setError("Cada línea debe tener un nombre o descripción corta.");
        return;
      }
      const unitPrice = parseDecimalInput(line.unitPrice);
      const quantity = parseDecimalInput(line.quantity);
      if (unitPrice == null || unitPrice < 0) {
        setError(`Precio unitario no válido en «${name}».`);
        return;
      }
      if (quantity == null || quantity <= 0) {
        setError(`Cantidad no válida en «${name}».`);
        return;
      }
      const row: (typeof parsedLines)[number] = {
        serviceId: line.serviceId,
        name,
        description: line.description.trim() || null,
        unitPrice,
        quantity,
      };
      if (line.itemType === "SERVICIO" || line.itemType === "PRODUCTO") {
        row.itemType = line.itemType;
      }
      parsedLines.push(row);
    }

    let dv: number | null = null;
    if (discountMode === "PERCENT" || discountMode === "FIXED") {
      const p = parseDecimalInput(discountValue);
      if (p == null || p < 0) {
        setError("Indica un valor de descuento válido o cambia el tipo a «Sin descuento».");
        return;
      }
      dv = p;
    }

    if (!selectedClientId.trim()) {
      setError("Selecciona un cliente.");
      return;
    }

    const payload = {
      serviceDate,
      title: title.trim() || null,
      templateId: effectiveTemplateId ?? null,
      clientId: selectedClientId.trim(),
      discountMode,
      discountValue: dv,
      vatChargedSeparately,
      lines: parsedLines,
      ...(customFields.length > 0
        ? {
            customFieldValues: Object.fromEntries(
              customFields.map((f) => [f.id, customValues[f.id] ?? ""]),
            ) as Record<string, string>,
          }
        : {}),
    };

    startTransition(async () => {
      if (isEditing && initialData?.quotationId) {
        const res = await updateQuotation({ ...payload, quotationId: initialData.quotationId });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push(`/cotizaciones/${initialData.quotationId}`);
        router.refresh();
      } else {
        const res = await createQuotation(payload);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push(`/cotizaciones/${res.id}`);
        router.refresh();
      }
    });
  }

  return (
    <>
      <ClientFormModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        initial={null}
        onCreated={(c) => setSelectedClientId(c.id)}
        onSuccess={() => router.refresh()}
      />

      <form onSubmit={onSubmit} className="space-y-8">
      <section className="border-border bg-card/60 max-w-3xl rounded-xl border p-5 shadow-sm">
        <h2 className="text-foreground mb-4 text-sm font-semibold">Cliente y servicio</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="serviceDate">Fecha del servicio</Label>
            <Input
              id="serviceDate"
              type="date"
              required
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quotationTitle">Título (opcional)</Label>
            <Input
              id="quotationTitle"
              value={title}
              maxLength={200}
              placeholder="Ej. Mantenimiento preventivo Q2"
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-muted-foreground text-[0.7rem]">
              Se muestra debajo del número de cotización en el PDF.
            </p>
          </div>

          {templates && templates.length > 0 ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="quotationTemplate">Formato del PDF</Label>
              <select
                id="quotationTemplate"
                value={effectiveTemplateId ?? ""}
                onChange={(e) => setSelectedTemplateId(e.target.value || null)}
                className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.isDefault ? " (predeterminado)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-[0.7rem]">
                Define el diseño del PDF de esta cotización. Puedes cambiarlo antes de guardar.
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <div className="grid min-w-0 flex-1 gap-1.5">
                <Label htmlFor="clientSelect">Cliente</Label>
                {initialClients.length > 0 ? (
                  <Popover.Root
                    open={clientPickerOpen}
                    onOpenChange={(open) => {
                      setClientPickerOpen(open);
                      if (!open) setClientSearch("");
                    }}
                  >
                    <Popover.Trigger
                      type="button"
                      id="clientSelect"
                      aria-expanded={clientPickerOpen}
                      aria-haspopup="listbox"
                      aria-controls="client-listbox-panel"
                      className={cn(
                        "border-input bg-background flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm outline-none transition-[color,box-shadow] select-none",
                        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                        !selectedClientId && "text-muted-foreground",
                      )}
                    >
                      <span className="min-w-0 truncate">
                        {selectedClient
                          ? formatClientOptionLabel(selectedClient)
                          : "Selecciona un cliente…"}
                      </span>
                      <ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-70" aria-hidden />
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        align="start"
                        sideOffset={4}
                        className={cn(
                          "border-border bg-popover text-popover-foreground z-50 max-h-[min(20rem,calc(100vh-6rem))] min-w-[var(--radix-popper-anchor-width)] overflow-hidden rounded-lg border p-0 shadow-md",
                          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                        )}
                        onOpenAutoFocus={(e) => {
                          e.preventDefault();
                          queueMicrotask(() => document.getElementById("clientSearch")?.focus());
                        }}
                      >
                        <div className="border-border border-b p-2">
                          <Input
                            id="clientSearch"
                            type="search"
                            autoComplete="off"
                            placeholder="Buscar por nombre, correo, teléfono o RUT…"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                e.stopPropagation();
                                setClientPickerOpen(false);
                              }
                            }}
                          />
                        </div>
                        <div
                          id="client-listbox-panel"
                          role="listbox"
                          aria-label="Clientes"
                          className="max-h-60 overflow-y-auto p-1"
                        >
                          {filteredClients.length === 0 ? (
                            <p className="text-muted-foreground px-2 py-6 text-center text-xs">
                              Sin coincidencias.
                            </p>
                          ) : (
                            filteredClients.map((c) => {
                              const selected = selectedClientId === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  role="option"
                                  aria-selected={selected}
                                  className={cn(
                                    "hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
                                    selected && "bg-accent text-accent-foreground",
                                  )}
                                  onClick={() => {
                                    setSelectedClientId(c.id);
                                    setClientPickerOpen(false);
                                    setClientSearch("");
                                  }}
                                >
                                  <Check
                                    className={cn("size-4 shrink-0", !selected && "invisible")}
                                    aria-hidden
                                  />
                                  <span className="min-w-0 flex-1 truncate">{formatClientOptionLabel(c)}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                ) : (
                  <select
                    id="clientSelect"
                    disabled
                    className="border-input bg-background text-muted-foreground h-10 w-full rounded-lg border px-3 text-sm"
                    value=""
                  >
                    <option value="">Sin clientes</option>
                  </select>
                )}
              </div>
              {canCreateClient ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full shrink-0 gap-2 sm:w-auto"
                  onClick={() => setClientModalOpen(true)}
                >
                  <UserPlus className="size-4" aria-hidden />
                  Nuevo cliente
                </Button>
              ) : null}
            </div>
            {initialClients.length === 0 ? (
              <p className="text-muted-foreground text-xs leading-relaxed">
                {canCreateClient
                  ? "No hay clientes aún. Usa «Nuevo cliente» para crear la ficha y asignarla a esta cotización."
                  : "No hay clientes registrados. Pide a un administrador que dé de alta clientes en Clientes."}
              </p>
            ) : selectedClient ? (
              <div className="border-border bg-muted/30 mt-2 rounded-lg border px-3 py-2 text-xs leading-relaxed">
                <p className="text-muted-foreground">
                  <span className="text-foreground font-medium">{CLIENT_KIND_LABEL[selectedClient.kind]}</span>
                  {selectedClient.email ? (
                    <>
                      {" · "}
                      <span className="break-all">{selectedClient.email}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/90"> · Sin correo</span>
                  )}
                  {selectedClient.phone ? (
                    <>
                      {" · "}
                      {selectedClient.phone}
                    </>
                  ) : null}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {customFields.length > 0 ? (
        <section className="border-border bg-card/60 max-w-3xl rounded-xl border p-5 shadow-sm">
          <h2 className="text-foreground mb-4 text-sm font-semibold">Campos adicionales</h2>
          <p className="text-muted-foreground mb-4 text-xs leading-relaxed">
            Definidos en Cotizaciones → Campos personalizados. Los obligatorios deben completarse antes de
            guardar.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {customFields.map((f) => (
              <div
                key={f.id}
                className={f.fieldType === "TEXTAREA" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}
              >
                <Label htmlFor={`cf-${f.id}`}>
                  {f.label}
                  {f.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                {f.fieldType === "TEXTAREA" ? (
                  <>
                    <textarea
                      id={`cf-${f.id}`}
                      required={f.required}
                      rows={3}
                      maxLength={5000}
                      value={customValues[f.id] ?? ""}
                      onChange={(e) => setCustomValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[4rem] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    />
                    <p className="text-muted-foreground text-[0.7rem]">
                      En el PDF puedes usar listas con <code className="text-xs">-</code> o{" "}
                      <code className="text-xs">1.</code> (indenta 2 espacios para sub-viñetas).
                    </p>
                  </>
                ) : f.fieldType === "NUMBER" ? (
                  <Input
                    id={`cf-${f.id}`}
                    inputMode="decimal"
                    required={f.required}
                    value={customValues[f.id] ?? ""}
                    onChange={(e) => setCustomValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  />
                ) : f.fieldType === "DATE" ? (
                  <Input
                    id={`cf-${f.id}`}
                    type="date"
                    required={f.required}
                    value={customValues[f.id] ?? ""}
                    onChange={(e) => setCustomValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  />
                ) : (
                  <Input
                    id={`cf-${f.id}`}
                    required={f.required}
                    maxLength={500}
                    value={customValues[f.id] ?? ""}
                    onChange={(e) => setCustomValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-border bg-card/60 max-w-3xl rounded-xl border p-5 shadow-sm">
        <h2 className="text-foreground mb-4 text-sm font-semibold">Ítems</h2>
        <p className="text-muted-foreground mb-4 text-xs leading-relaxed">
          Puedes insertar filas desde el catálogo y editar precio, cantidad o texto solo para esta
          cotización (no se modifica el catálogo).
        </p>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="catalog-pick-trigger">Añadir desde catálogo</Label>
            {catalogServices.length > 0 ? (
              <Popover.Root
                open={catalogPickerOpen}
                onOpenChange={(open) => {
                  setCatalogPickerOpen(open);
                  if (!open) setCatalogSearch("");
                }}
              >
                <Popover.Trigger
                  type="button"
                  id="catalog-pick-trigger"
                  aria-expanded={catalogPickerOpen}
                  aria-haspopup="listbox"
                  aria-controls="catalog-listbox-panel"
                  className={cn(
                    "border-input bg-background flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm outline-none transition-[color,box-shadow] select-none",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    !catalogPick && "text-muted-foreground",
                  )}
                >
                  <span className="min-w-0 truncate">
                    {selectedCatalogService ? selectedCatalogService.name : "Selecciona un servicio o producto…"}
                  </span>
                  <ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-70" aria-hidden />
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    align="start"
                    sideOffset={4}
                    className={cn(
                      "border-border bg-popover text-popover-foreground z-50 max-h-[min(20rem,calc(100vh-6rem))] min-w-[var(--radix-popper-anchor-width)] overflow-hidden rounded-lg border p-0 shadow-md",
                      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    )}
                    onOpenAutoFocus={(e) => {
                      e.preventDefault();
                      queueMicrotask(() => document.getElementById("catalogSearch")?.focus());
                    }}
                  >
                    <div className="border-border border-b p-2">
                      <Input
                        id="catalogSearch"
                        type="search"
                        autoComplete="off"
                        placeholder="Buscar por nombre o descripción…"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        className="h-9"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.stopPropagation();
                            setCatalogPickerOpen(false);
                          }
                        }}
                      />
                    </div>
                    <div
                      id="catalog-listbox-panel"
                      role="listbox"
                      aria-label="Catálogo"
                      className="max-h-60 overflow-y-auto p-1"
                    >
                      {filteredServices.length === 0 ? (
                        <p className="text-muted-foreground px-2 py-6 text-center text-xs">
                          Sin coincidencias.
                        </p>
                      ) : (
                        filteredServices.map((s) => {
                          const selected = catalogPick === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              className={cn(
                                "hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
                                selected && "bg-accent text-accent-foreground",
                              )}
                              onClick={() => {
                                setCatalogPick(s.id);
                                setCatalogPickerOpen(false);
                                setCatalogSearch("");
                              }}
                            >
                              <Check
                                className={cn("size-4 shrink-0", !selected && "invisible")}
                                aria-hidden
                              />
                              <span className="min-w-0 flex-1 truncate">
                                {s.name}
                                {s.description ? (
                                  <span className="text-muted-foreground ml-1.5 text-xs">
                                    — {s.description}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            ) : (
              <div className="border-input bg-muted/40 text-muted-foreground flex h-10 w-full items-center rounded-lg border px-3 text-sm">
                Sin servicios en el catálogo
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2 sm:w-auto"
            disabled={!catalogPick}
            onClick={addFromCatalog}
          >
            <Plus className="size-4" aria-hidden />
            Insertar
          </Button>
          <Button type="button" variant="outline" className="w-full gap-2 sm:w-auto" onClick={addEmptyLine}>
            Línea manual
          </Button>
        </div>

        <div className="space-y-4">
          {lines.map((line, idx) => (
            <div
              key={line.key}
              className={cn(
                "border-border space-y-3 rounded-lg border p-4",
                line.serviceId ? "bg-primary/[0.03]" : "bg-muted/20",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  Línea {idx + 1}
                  {line.serviceId ? (
                    <span className="text-primary ml-2">(desde catálogo)</span>
                  ) : null}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive size-9 shrink-0"
                  disabled={lines.length <= 1}
                  onClick={() => removeLine(line.key)}
                  aria-label="Quitar línea"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`name-${line.key}`}>Nombre</Label>
                  <Input
                    id={`name-${line.key}`}
                    required
                    maxLength={200}
                    value={line.name}
                    onChange={(e) => updateLine(line.key, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`desc-${line.key}`}>Descripción (opcional)</Label>
                  <textarea
                    id={`desc-${line.key}`}
                    rows={2}
                    maxLength={5000}
                    value={line.description}
                    onChange={(e) => updateLine(line.key, { description: e.target.value })}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[3.5rem] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`type-${line.key}`}>Tipo</Label>
                  <select
                    id={`type-${line.key}`}
                    value={line.itemType}
                    onChange={(e) =>
                      updateLine(line.key, {
                        itemType: e.target.value as DraftLine["itemType"],
                      })
                    }
                    className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
                  >
                    <option value="">Sin tipo</option>
                    <option value="SERVICIO">{SERVICE_ITEM_TYPE_LABEL.SERVICIO}</option>
                    <option value="PRODUCTO">{SERVICE_ITEM_TYPE_LABEL.PRODUCTO}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`qty-${line.key}`}>Cantidad</Label>
                  <Input
                    id={`qty-${line.key}`}
                    inputMode="decimal"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`price-${line.key}`}>Precio unitario</Label>
                  <Input
                    id={`price-${line.key}`}
                    inputMode="decimal"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-border bg-card/60 max-w-3xl rounded-xl border p-5 shadow-sm">
        <h2 className="text-foreground mb-4 text-sm font-semibold">Descuento e IVA</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="discountMode">Tipo</Label>
            <select
              id="discountMode"
              value={discountMode}
              onChange={(e) => setDiscountMode(e.target.value as QuoteDiscountMode)}
              className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
            >
              <option value="NONE">Sin descuento</option>
              <option value="PERCENT">Porcentaje sobre el subtotal</option>
              <option value="FIXED">Monto fijo</option>
            </select>
          </div>
          {discountMode !== "NONE" ? (
            <div className="space-y-1.5">
              <Label htmlFor="discountValue">
                {discountMode === "PERCENT" ? "Porcentaje (%)" : "Monto"}
              </Label>
              <Input
                id="discountValue"
                inputMode="decimal"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountMode === "PERCENT" ? "Ej. 10" : "Ej. 5000"}
              />
            </div>
          ) : null}
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-input"
            checked={vatChargedSeparately}
            onChange={(e) => setVatChargedSeparately(e.target.checked)}
          />
          <span className="text-sm leading-snug">
            <span className="text-foreground font-medium">IVA (19%) se cobra aparte</span>
            <span className="text-muted-foreground mt-0.5 block text-xs">
              Si no marcas esta opción, se asume que el 19% ya está incluido en los precios y en el
              total.
            </span>
          </span>
        </label>

        <div className="border-border mt-6 space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground tabular-nums">{priceFmt.format(preview.subtotal)}</span>
          </div>
          {discountMode !== "NONE" && preview.discountAmount > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuento</span>
              <span className="text-foreground tabular-nums">
                −{priceFmt.format(preview.discountAmount)}
              </span>
            </div>
          ) : null}
          {vatChargedSeparately && preview.vatAmount > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA (19%)</span>
              <span className="text-foreground tabular-nums">{priceFmt.format(preview.vatAmount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-semibold">
            <span>Total cotización</span>
            <span className="text-primary tabular-nums">{priceFmt.format(preview.total)}</span>
          </div>
          {!vatChargedSeparately ? (
            <p className="text-muted-foreground text-xs">IVA (19%) incluido en el total</p>
          ) : null}
        </div>
      </section>

      {error ? (
        <p className="text-destructive max-w-3xl text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="gap-2" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Guardando…
            </>
          ) : isEditing ? (
            "Guardar cambios"
          ) : (
            "Generar cotización"
          )}
        </Button>
        <Button type="button" variant="secondary" asChild>
          <Link href={isEditing && initialData?.quotationId ? `/cotizaciones/${initialData.quotationId}` : "/cotizaciones"}>
            Cancelar
          </Link>
        </Button>
      </div>
    </form>
    </>
  );
}
