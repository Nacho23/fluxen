import type { QuotationPdfData } from "@/lib/quotations/quotation-pdf-types";

export type SampleCustomFieldDef = { id: string; label: string };

/** Datos de ejemplo para la vista previa del constructor de formato. */
export function buildSampleQuotationPdfData(
  company: {
    name: string;
    businessName: string | null;
    rut: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    city: string | null;
    country: string | null;
    logoUrl: string | null;
  },
  customFieldDefs?: SampleCustomFieldDef[],
): QuotationPdfData {
  const customFieldRows =
    customFieldDefs && customFieldDefs.length > 0
      ? customFieldDefs.map((f, i) => ({
          id: f.id,
          label: f.label,
          value:
            i === 0
              ? "Incluye:\n- Visita técnica\n  - Revisión equipos\n  - Informe PDF"
              : "Valor de ejemplo",
        }))
      : [
          { id: "sample-field-1", label: "Ubicación", value: "Oficina central, piso 3" },
          { id: "sample-field-2", label: "Referencia", value: "Mantenimiento preventivo Q2" },
        ];
  return {
    title: "Mantenimiento preventivo equipos Q2",
    company: {
      name: company.name,
      businessName: company.businessName,
      rut: company.rut,
      address: company.address,
      phone: company.phone,
      email: company.email,
      website: company.website,
      city: company.city,
      country: company.country,
      logoUrl: company.logoUrl,
    },
    quoteNumber: "COT-00042",
    serviceDateLabel: "22 de mayo de 2026",
    clientName: "Cliente de ejemplo SpA",
    clientEmail: "contacto@ejemplo.cl",
    clientPhone: "+56 9 1234 5678",
    clientNotes: "Acceso por recepción.\n- Solicitar credencial\n- Estacionamiento subterráneo",
    customFieldRows,
    lines: [
      {
        name: "Revisión de equipos",
        description: "Inspección general y informe",
        itemTypeLabel: "Servicio",
        unitPrice: "$85.000",
        quantity: "1",
        lineTotal: "$85.000",
      },
      {
        name: "Repuesto filtro HEPA",
        description: null,
        itemTypeLabel: "Material",
        unitPrice: "$12.500",
        quantity: "2",
        lineTotal: "$25.000",
      },
    ],
    subtotal: "$110.000",
    discountMode: "PERCENT",
    discountLabel: "Descuento (10%)",
    discountAmount: "$11.000",
    vatChargedSeparately: true,
    vatAmount: "$18.810",
    total: "$117.810",
  };
}
