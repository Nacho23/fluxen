"use client";

import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { ClientFormModal } from "@/components/clientes/client-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CLIENT_KIND_LABEL } from "@/lib/data/client-kind";
import type { ClientRow } from "@/lib/data/company-clients";
import type { ServiceRow } from "@/lib/data/company-services";
import { SERVICE_ITEM_TYPE_LABEL } from "@/lib/data/service-item-type";
import { previewLineTotal, previewQuotationTotals } from "@/lib/quotations/preview-totals";
import { cn } from "@/lib/utils";
import { createQuotation } from "@/server/actions/quotations";
import { QuoteDiscountMode } from "@prisma/client";

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

export function NewQuotationForm({
  catalogServices,
  initialClients,
  canCreateClient,
}: Readonly<{
  catalogServices: ServiceRow[];
  initialClients: ClientRow[];
  canCreateClient: boolean;
}>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [serviceDate, setServiceDate] = useState(todayLocalISO);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [discountMode, setDiscountMode] = useState<QuoteDiscountMode>("NONE");
  const [discountValue, setDiscountValue] = useState("");
  const [lines, setLines] = useState<DraftLine[]>(() => [createEmptyLine("draft-line-0")]);

  const [catalogPick, setCatalogPick] = useState("");

  const selectedClient = useMemo(
    () => initialClients.find((c) => c.id === selectedClientId),
    [initialClients, selectedClientId],
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
    return previewQuotationTotals(lineTotals, discountMode, dv);
  }, [lines, discountMode, discountValue]);

  function addEmptyLine() {
    setLines((prev) => [...prev, createEmptyLine()]);
  }

  function addFromCatalog() {
    if (!catalogPick) return;
    const s = catalogServices.find((x) => x.id === catalogPick);
    if (!s) return;
    setLines((prev) => [...prev, lineFromService(s)]);
    setCatalogPick("");
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
      clientId: selectedClientId.trim(),
      discountMode,
      discountValue: dv,
      lines: parsedLines,
    };

    startTransition(async () => {
      const res = await createQuotation(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/cotizaciones/${res.id}`);
      router.refresh();
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
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <div className="grid min-w-0 flex-1 gap-1.5">
                <Label htmlFor="clientSelect">Cliente</Label>
                <select
                  id="clientSelect"
                  required={initialClients.length > 0}
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
                >
                  <option value="">Selecciona un cliente…</option>
                  {initialClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.email ? `${c.name} · ${c.email}` : c.name}
                    </option>
                  ))}
                </select>
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

      <section className="border-border bg-card/60 max-w-3xl rounded-xl border p-5 shadow-sm">
        <h2 className="text-foreground mb-4 text-sm font-semibold">Ítems</h2>
        <p className="text-muted-foreground mb-4 text-xs leading-relaxed">
          Puedes insertar filas desde el catálogo y editar precio, cantidad o texto solo para esta
          cotización (no se modifica el catálogo).
        </p>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="catalog-pick">Añadir desde catálogo</Label>
            <select
              id="catalog-pick"
              value={catalogPick}
              onChange={(e) => setCatalogPick(e.target.value)}
              className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
            >
              <option value="">Selecciona un servicio o producto…</option>
              {catalogServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="secondary" className="w-full gap-2 sm:w-auto" onClick={addFromCatalog}>
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
        <h2 className="text-foreground mb-4 text-sm font-semibold">Descuento</h2>
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
          <div className="flex justify-between text-base font-semibold">
            <span>Total cotización</span>
            <span className="text-primary tabular-nums">{priceFmt.format(preview.total)}</span>
          </div>
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
          ) : (
            "Generar cotización"
          )}
        </Button>
        <Button type="button" variant="secondary" asChild>
          <Link href="/cotizaciones">Cancelar</Link>
        </Button>
      </div>
    </form>
    </>
  );
}
