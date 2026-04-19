import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { QuoteDiscountMode } from "@/lib/prisma/enums-public";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    marginBottom: 4,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 110,
    color: "#64748b",
  },
  value: {
    flex: 1,
    color: "#0f172a",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
    marginTop: 16,
    marginBottom: 6,
  },
  th: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
  },
  colDesc: { width: "42%" },
  colType: { width: "12%" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "17%", textAlign: "right" },
  colTotal: { width: "17%", textAlign: "right" },
  totals: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
    gap: 24,
  },
  totalLabel: { color: "#64748b", width: 100, textAlign: "right" },
  totalValue: { fontFamily: "Helvetica", fontWeight: "bold", width: 80, textAlign: "right" },
  grandTotal: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
  },
  grandLabel: {
    fontSize: 11,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    color: "#0f172a",
    width: 100,
    textAlign: "right",
  },
  grandValue: {
    fontSize: 12,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    color: "#0f172a",
    width: 80,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

export type QuotationPdfLine = {
  name: string;
  description: string | null;
  itemTypeLabel: string | null;
  unitPrice: string;
  quantity: string;
  lineTotal: string;
};

export type QuotationPdfDocumentProps = {
  companyName: string;
  quoteNumber: string;
  serviceDateLabel: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  lines: QuotationPdfLine[];
  subtotal: string;
  discountMode: QuoteDiscountMode;
  discountLabel: string;
  discountAmount: string;
  total: string;
};

/** Una página A4; envolver en `<Document>` en el servidor para `renderToBuffer`. */
export function QuotationPdfPage({
  companyName,
  quoteNumber,
  serviceDateLabel,
  clientName,
  clientEmail,
  clientPhone,
  lines,
  subtotal,
  discountMode,
  discountLabel,
  discountAmount,
  total,
}: Readonly<QuotationPdfDocumentProps>) {
  return (
    <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Cotización {quoteNumber}</Text>
        <Text style={styles.subtitle}>{companyName}</Text>

        <Text style={styles.sectionLabel}>Cliente</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nombre / empresa</Text>
          <Text style={styles.value}>{clientName}</Text>
        </View>
        {clientEmail ? (
          <View style={styles.row}>
            <Text style={styles.label}>Correo</Text>
            <Text style={styles.value}>{clientEmail}</Text>
          </View>
        ) : null}
        {clientPhone ? (
          <View style={styles.row}>
            <Text style={styles.label}>Teléfono</Text>
            <Text style={styles.value}>{clientPhone}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.label}>Fecha del servicio</Text>
          <Text style={styles.value}>{serviceDateLabel}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colDesc]}>Descripción</Text>
          <Text style={[styles.th, styles.colType]}>Tipo</Text>
          <Text style={[styles.th, styles.colQty]}>Cant.</Text>
          <Text style={[styles.th, styles.colPrice]}>P. unit.</Text>
          <Text style={[styles.th, styles.colTotal]}>Total</Text>
        </View>

        {lines.map((line, i) => (
          <View key={i} style={styles.tableRow} wrap={false}>
            <View style={styles.colDesc}>
              <Text style={{ fontFamily: "Helvetica", fontWeight: "bold" }}>{line.name}</Text>
              {line.description ? (
                <Text style={{ color: "#64748b", fontSize: 8, marginTop: 2 }}>{line.description}</Text>
              ) : null}
            </View>
            <Text style={[styles.colType, { fontSize: 9 }]}>{line.itemTypeLabel ?? "—"}</Text>
            <Text style={styles.colQty}>{line.quantity}</Text>
            <Text style={styles.colPrice}>{line.unitPrice}</Text>
            <Text style={styles.colTotal}>{line.lineTotal}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{subtotal}</Text>
          </View>
          {discountMode !== "NONE" ? (
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>{discountLabel}</Text>
              <Text style={styles.totalValue}>-{discountAmount}</Text>
            </View>
          ) : null}
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{total}</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          Documento generado electrónicamente · {quoteNumber}
        </Text>
    </Page>
  );
}

export function QuotationPdfDocument(props: Readonly<QuotationPdfDocumentProps>) {
  return (
    <Document>
      <QuotationPdfPage {...props} />
    </Document>
  );
}
