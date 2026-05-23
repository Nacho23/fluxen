import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { QuotationPdfData } from "@/lib/quotations/quotation-pdf-types";
import {
  isCustomSectionId,
  orderedEnabledBlocks,
  type QuotationTemplateLayout,
} from "@/lib/quotations/template-schema";
import type { QuoteDiscountMode } from "@/lib/prisma/enums-public";
import { parseRichTextBlocks, type RichTextListItem } from "@/lib/quotations/parse-rich-text-blocks";

function buildStyles(accent: string) {
  return StyleSheet.create({
    page: {
      paddingTop: 44,
      paddingBottom: 44,
      paddingHorizontal: 44,
      fontSize: 10,
      fontFamily: "Helvetica",
      color: "#1a1a1a",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 18,
      gap: 16,
    },
    logo: {
      width: 72,
      height: 72,
      objectFit: "contain",
    },
    title: {
      fontSize: 18,
      fontFamily: "Helvetica",
      fontWeight: "bold",
      marginBottom: 2,
      color: accent,
    },
    quoteNumber: {
      fontSize: 11,
      color: "#64748b",
    },
    companyName: {
      fontSize: 11,
      fontFamily: "Helvetica",
      fontWeight: "bold",
      color: "#0f172a",
      marginBottom: 2,
    },
    companyLine: {
      fontSize: 9,
      color: "#64748b",
      marginBottom: 1,
    },
    sectionLabel: {
      fontSize: 9,
      fontFamily: "Helvetica",
      fontWeight: "bold",
      color: accent,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
      marginTop: 4,
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
      borderBottomColor: accent,
      paddingBottom: 6,
      marginTop: 10,
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
    totals: {
      marginTop: 16,
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
      borderTopColor: accent,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 24,
    },
    grandLabel: {
      fontSize: 11,
      fontFamily: "Helvetica",
      fontWeight: "bold",
      color: accent,
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
    terms: {
      marginTop: 14,
      fontSize: 8,
      color: "#64748b",
      lineHeight: 1.4,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 44,
      right: 44,
      fontSize: 8,
      color: "#94a3b8",
      textAlign: "center",
    },
  });
}

type ColStyles = {
  colDesc: { width: string };
  colType: { width: string };
  colQty: { width: string; textAlign: "right" };
  colPrice: { width: string; textAlign: "right" };
  colTotal: { width: string; textAlign: "right" };
};

function columnWidths(showType: boolean): ColStyles {
  if (showType) {
    return {
      colDesc: { width: "42%" },
      colType: { width: "12%" },
      colQty: { width: "12%", textAlign: "right" },
      colPrice: { width: "17%", textAlign: "right" },
      colTotal: { width: "17%", textAlign: "right" },
    };
  }
  return {
    colDesc: { width: "50%" },
    colType: { width: "0%" },
    colQty: { width: "14%", textAlign: "right" },
    colPrice: { width: "18%", textAlign: "right" },
    colTotal: { width: "18%", textAlign: "right" },
  };
}

function CompanyBlock({
  layout,
  data,
  styles,
}: Readonly<{
  layout: QuotationTemplateLayout;
  data: QuotationPdfData;
  styles: ReturnType<typeof buildStyles>;
}>) {
  const c = layout.company;
  const co = data.company;
  const nameNorm = co.name.trim().toLowerCase();
  const businessNorm = co.businessName?.trim().toLowerCase() ?? "";
  const lines: string[] = [];
  if (
    c.showBusinessName &&
    co.businessName?.trim() &&
    businessNorm !== nameNorm
  ) {
    lines.push(co.businessName.trim());
  }
  if (c.showRut && co.rut?.trim()) lines.push(`RUT: ${co.rut.trim()}`);
  if (c.showAddress && co.address?.trim()) lines.push(co.address.trim());
  if (c.showCityCountry) {
    const cityCountry = [co.city?.trim(), co.country?.trim()].filter(Boolean).join(", ");
    if (cityCountry) lines.push(cityCountry);
  }
  if (c.showPhone && co.phone?.trim()) lines.push(co.phone.trim());
  if (c.showEmail && co.email?.trim()) lines.push(co.email.trim());
  if (c.showWebsite && co.website?.trim()) lines.push(co.website.trim());

  const showText = c.showName || lines.length > 0;

  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        {c.showName ? <Text style={styles.companyName}>{co.name}</Text> : null}
        {lines.map((line, i) => (
          <Text key={i} style={styles.companyLine}>
            {line}
          </Text>
        ))}
        {!showText && !c.showLogo ? (
          <Text style={styles.companyName}>{co.name}</Text>
        ) : null}
      </View>
      {c.showLogo && co.logoUrl ? (
        <Image src={co.logoUrl} style={styles.logo} />
      ) : null}
    </View>
  );
}

function QuoteMetaBlock({
  layout,
  data,
}: Readonly<{
  layout: QuotationTemplateLayout;
  data: QuotationPdfData;
}>) {
  const qm = layout.quoteMeta;
  const titleStyle = {
    fontSize: qm.titleSize,
    fontFamily: "Helvetica" as const,
    fontWeight: qm.titleBold ? ("bold" as const) : ("normal" as const),
    color: layout.accentColor,
    textAlign: qm.titleAlign as "left" | "center" | "right",
    marginBottom: 2,
  };
  const subtitleStyle = {
    fontSize: qm.subtitleSize,
    fontFamily: "Helvetica" as const,
    fontWeight: qm.subtitleBold ? ("bold" as const) : ("normal" as const),
    color: "#0f172a",
    textAlign: qm.subtitleAlign as "left" | "center" | "right",
    marginTop: 2,
    marginBottom: 4,
  };
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={titleStyle}>
        {layout.documentTitle ? `${layout.documentTitle} ${data.quoteNumber}` : data.quoteNumber}
      </Text>
      {data.title?.trim() ? (
        <Text style={subtitleStyle}>{data.title.trim()}</Text>
      ) : null}
    </View>
  );
}

function ClientRow({
  label,
  showLabel,
  value,
  styles,
}: Readonly<{
  label: string;
  showLabel: boolean;
  value: string;
  styles: ReturnType<typeof buildStyles>;
}>) {
  if (!value) return null;
  const labelText = label.trim();
  return (
    <View style={styles.row}>
      {showLabel ? (
        labelText ? (
          <Text style={styles.label}>{labelText}</Text>
        ) : (
          <View style={styles.label} />
        )
      ) : null}
      <Text style={showLabel ? styles.value : { ...styles.value, flex: undefined }}>
        {value}
      </Text>
    </View>
  );
}

function ClientNotesRow({
  label,
  showLabel,
  value,
  styles,
}: Readonly<{
  label: string;
  showLabel: boolean;
  value: string;
  styles: ReturnType<typeof buildStyles>;
}>) {
  const text = value.trim();
  if (!text) return null;
  const labelText = label.trim();
  const bodyStyle: BodyTextStyle = {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.45,
    textAlign: "left",
  };
  return (
    <View style={[styles.row, { alignItems: "flex-start" }]}>
      {showLabel ? (
        labelText ? (
          <Text style={styles.label}>{labelText}</Text>
        ) : (
          <View style={styles.label} />
        )
      ) : null}
      <View style={showLabel ? { flex: 1 } : undefined}>
        <RichTextBody text={text} style={bodyStyle} />
      </View>
    </View>
  );
}

function ClientBlock({
  layout,
  data,
  styles,
}: Readonly<{
  layout: QuotationTemplateLayout;
  data: QuotationPdfData;
  styles: ReturnType<typeof buildStyles>;
}>) {
  const cl = layout.client;
  return (
    <View wrap={false}>
      <Text style={styles.sectionLabel}>{cl.sectionTitle}</Text>
      {cl.showName ? (
        <ClientRow
          label={cl.labelName}
          showLabel={cl.showLabelName}
          value={data.clientName}
          styles={styles}
        />
      ) : null}
      {cl.showEmail && data.clientEmail ? (
        <ClientRow
          label={cl.labelEmail}
          showLabel={cl.showLabelEmail}
          value={data.clientEmail}
          styles={styles}
        />
      ) : null}
      {cl.showPhone && data.clientPhone ? (
        <ClientRow
          label={cl.labelPhone}
          showLabel={cl.showLabelPhone}
          value={data.clientPhone}
          styles={styles}
        />
      ) : null}
      {cl.showServiceDate ? (
        <ClientRow
          label={cl.labelServiceDate}
          showLabel={cl.showLabelServiceDate}
          value={data.serviceDateLabel}
          styles={styles}
        />
      ) : null}
      {cl.showNotes && data.clientNotes ? (
        <ClientNotesRow
          label={cl.labelNotes}
          showLabel={cl.showLabelNotes}
          value={data.clientNotes}
          styles={styles}
        />
      ) : null}
    </View>
  );
}

function CustomFieldsBlock({
  layout,
  data,
  styles,
}: Readonly<{
  layout: QuotationTemplateLayout;
  data: QuotationPdfData;
  styles: ReturnType<typeof buildStyles>;
}>) {
  const rows = data.customFieldRows;
  if (!rows?.length) return null;
  return (
    <View wrap={false}>
      <Text style={[styles.sectionLabel, { marginTop: 10 }]}>
        {layout.customFields.sectionTitle}
      </Text>
      {rows.map((row, i) => (
        <View key={i} style={styles.row} wrap={false}>
          <Text style={styles.label}>{row.label}</Text>
          <View style={{ flex: 1 }}>
            <RichTextBody
              text={row.value}
              style={{
                fontFamily: "Helvetica",
                fontSize: 9,
                color: "#0f172a",
                lineHeight: 1.45,
                textAlign: "left",
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function LinesBlock({
  layout,
  data,
  styles,
}: Readonly<{
  layout: QuotationTemplateLayout;
  data: QuotationPdfData;
  styles: ReturnType<typeof buildStyles>;
}>) {
  const ln = layout.lines;
  const cols = columnWidths(ln.showTypeColumn);
  const sectionTitle = ln.sectionTitle.trim();
  return (
    <View>
      {sectionTitle ? (
        <Text style={styles.sectionLabel}>{sectionTitle}</Text>
      ) : null}
      <View style={sectionTitle ? { ...styles.tableHeader, marginTop: 0 } : styles.tableHeader}>
        <Text style={[styles.th, cols.colDesc]}>{ln.labelDescription}</Text>
        {ln.showTypeColumn ? (
          <Text style={[styles.th, cols.colType]}>{ln.labelType}</Text>
        ) : null}
        <Text style={[styles.th, cols.colQty]}>{ln.labelQuantity}</Text>
        <Text style={[styles.th, cols.colPrice]}>{ln.labelUnitPrice}</Text>
        <Text style={[styles.th, cols.colTotal]}>{ln.labelLineTotal}</Text>
      </View>
      {data.lines.map((line, i) => (
        <View key={i} style={styles.tableRow} wrap={false}>
          <View style={cols.colDesc}>
            <Text style={{ fontFamily: "Helvetica", fontWeight: "bold" }}>{line.name}</Text>
            {line.description ? (
              <Text style={{ color: "#64748b", fontSize: 8, marginTop: 2 }}>
                {line.description}
              </Text>
            ) : null}
          </View>
          {ln.showTypeColumn ? (
            <Text style={[cols.colType, { fontSize: 9 }]}>{line.itemTypeLabel ?? "—"}</Text>
          ) : null}
          <Text style={cols.colQty}>{line.quantity}</Text>
          <Text style={cols.colPrice}>{line.unitPrice}</Text>
          <Text style={cols.colTotal}>{line.lineTotal}</Text>
        </View>
      ))}
    </View>
  );
}

function TotalsBlock({
  layout,
  data,
  styles,
  discountMode,
}: Readonly<{
  layout: QuotationTemplateLayout;
  data: QuotationPdfData;
  styles: ReturnType<typeof buildStyles>;
  discountMode: QuoteDiscountMode;
}>) {
  const t = layout.totals;
  return (
    <View style={styles.totals}>
      <View style={styles.totalLine}>
        <Text style={styles.totalLabel}>{t.labelSubtotal}</Text>
        <Text style={styles.totalValue}>{data.subtotal}</Text>
      </View>
      {discountMode !== "NONE" ? (
        <View style={styles.totalLine}>
          <Text style={styles.totalLabel}>{data.discountLabel || t.labelDiscount}</Text>
          <Text style={styles.totalValue}>-{data.discountAmount}</Text>
        </View>
      ) : null}
      {data.vatChargedSeparately ? (
        <View style={styles.totalLine}>
          <Text style={styles.totalLabel}>{t.labelVat}</Text>
          <Text style={styles.totalValue}>{data.vatAmount}</Text>
        </View>
      ) : null}
      <View style={styles.grandTotal}>
        <Text style={styles.grandLabel}>{t.labelTotal}</Text>
        <Text style={styles.grandValue}>{data.total}</Text>
      </View>
      {data.vatChargedSeparately ? null : (
        <Text
          style={{
            fontSize: 8,
            color: "#64748b",
            textAlign: "right",
            marginTop: 4,
          }}
        >
          {data.vatIncludedAmount
            ? `${t.labelVatIncluded} (${data.vatIncludedAmount})`
            : t.labelVatIncluded}
        </Text>
      )}
    </View>
  );
}

type BodyTextStyle = {
  fontFamily: string;
  fontSize: number;
  color: string;
  lineHeight: number;
  textAlign: "left" | "center" | "right" | "justify";
};

function RichTextListItems({
  items,
  style,
  ordered,
  depth = 0,
}: Readonly<{
  items: RichTextListItem[];
  style: BodyTextStyle;
  ordered: boolean;
  depth?: number;
}>) {
  return (
    <>
      {items.map((item, i) => (
        <View key={`${depth}-${i}-${item.text.slice(0, 12)}`}>
          <View
            style={{
              flexDirection: "row",
              marginBottom: 2,
              paddingLeft: depth * 14 + 2,
            }}
          >
            <Text style={{ ...style, width: ordered ? 14 : 10, textAlign: "left" }}>
              {ordered ? `${i + 1}.` : depth === 0 ? "\u2022" : "-"}
            </Text>
            <Text style={{ ...style, flex: 1 }}>{item.text}</Text>
          </View>
          {item.children.length > 0 ? (
            <RichTextListItems
              items={item.children}
              style={style}
              ordered={ordered}
              depth={depth + 1}
            />
          ) : null}
        </View>
      ))}
    </>
  );
}

function RichTextBody({
  text,
  style,
}: Readonly<{
  text: string;
  style: BodyTextStyle;
}>) {
  const blocks = parseRichTextBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <View>
      {blocks.map((block, bi) => {
        if (block.type === "paragraph") {
          return (
            <Text
              key={`p-${bi}`}
              style={{ ...style, marginBottom: block.lines.length > 0 ? 4 : 0 }}
            >
              {block.lines.join("\n")}
            </Text>
          );
        }
        if (block.type === "bullet") {
          return (
            <View key={`b-${bi}`} style={{ marginBottom: 4 }}>
              <RichTextListItems items={block.items} style={style} ordered={false} />
            </View>
          );
        }
        return (
          <View key={`n-${bi}`} style={{ marginBottom: 4 }}>
            <RichTextListItems items={block.items} style={style} ordered />
          </View>
        );
      })}
    </View>
  );
}

function TermsBlock({
  layout,
  styles,
}: Readonly<{
  layout: QuotationTemplateLayout;
  styles: ReturnType<typeof buildStyles>;
}>) {
  const body = layout.terms.body.trim();
  return (
    <View style={{ marginTop: 12 }} wrap={false}>
      <Text style={styles.sectionLabel}>{layout.terms.sectionTitle}</Text>
      {body ? (
        <Text style={styles.terms}>{body}</Text>
      ) : (
        <Text style={[styles.terms, { color: "#cbd5e1", fontStyle: "italic" }]}>
          (sin contenido)
        </Text>
      )}
    </View>
  );
}

function CustomSectionBlock({
  layout,
  blockId,
  data,
  styles,
}: Readonly<{
  layout: QuotationTemplateLayout;
  blockId: string;
  data: QuotationPdfData;
  styles: ReturnType<typeof buildStyles>;
}>) {
  const section = layout.customSections.find((s) => s.id === blockId);
  if (!section) return null;
  const body = section.body.trim();
  const sectionTitle = section.title.trim();
  const bodyFont = section.bodyBold ? "Helvetica-Bold" : "Helvetica";
  const bodyAlign = section.bodyAlign as "left" | "center" | "right" | "justify";
  const hasFieldValues = section.fieldRefs.some((ref) => {
    const row = data.customFieldRows?.find((r) => r.id === ref.fieldId);
    return Boolean(row?.value?.trim());
  });

  return (
    <View style={{ marginTop: 12 }} wrap={false}>
      {sectionTitle ? <Text style={styles.sectionLabel}>{sectionTitle}</Text> : null}
      {body ? (
        <RichTextBody
          text={body}
          style={{
            fontFamily: bodyFont,
            fontSize: section.bodySize,
            color: "#334155",
            lineHeight: 1.45,
            textAlign: bodyAlign,
          }}
        />
      ) : !hasFieldValues && section.fieldRefs.length === 0 ? (
        <Text style={[styles.terms, { color: "#cbd5e1", fontStyle: "italic" }]}>
          (sin contenido)
        </Text>
      ) : null}
      {section.fieldRefs.map((ref) => {
        const row = data.customFieldRows?.find((r) => r.id === ref.fieldId);
        if (!row?.value?.trim()) return null;
        const valFont = ref.bold ? "Helvetica-Bold" : "Helvetica";
        const valAlign = ref.align as "left" | "center" | "right" | "justify";
        return (
          <View key={ref.id} style={{ marginTop: sectionTitle || body ? 6 : 0 }}>
            <RichTextBody
              text={row.value.trim()}
              style={{
                fontFamily: valFont,
                fontSize: ref.size,
                color: "#334155",
                lineHeight: 1.45,
                textAlign: valAlign,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

function sigFontFamily(bold: boolean, italic: boolean) {
  if (bold && italic) return "Helvetica-BoldOblique";
  if (bold) return "Helvetica-Bold";
  if (italic) return "Helvetica-Oblique";
  return "Helvetica";
}

function SignatureBlock({
  layout,
  styles,
}: Readonly<{
  layout: QuotationTemplateLayout;
  styles: ReturnType<typeof buildStyles>;
}>) {
  const sig = layout.signature;
  const textAlign = sig.align as "left" | "center" | "right";
  return (
    <View style={{ marginTop: 20 }} wrap={false}>
      {sig.rows.map((row, i) => (
        <Text
          key={i}
          style={{
            fontSize: row.size,
            fontFamily: sigFontFamily(row.bold, row.italic),
            textAlign,
            color: "#0f172a",
            marginBottom: 2,
          }}
        >
          {row.text || " "}
        </Text>
      ))}
    </View>
  );
}

function FooterBlock({
  layout,
  data,
  styles,
}: Readonly<{
  layout: QuotationTemplateLayout;
  data: QuotationPdfData;
  styles: ReturnType<typeof buildStyles>;
}>) {
  const { body, showBody, showPageNumber, distribution } = layout.footer;
  const rawBody = showBody ? body.trim() : "";
  const showPage = showPageNumber;

  if (!rawBody && !showPage) return null;

  const resolvedBody = rawBody.includes("{number}")
    ? rawBody.replace(/\{number\}/g, data.quoteNumber)
    : rawBody;

  const baseStyle = {
    position: "absolute" as const,
    bottom: 24,
    left: 44,
    right: 44,
    fontSize: 8,
    color: "#94a3b8",
  };

  if (distribution === "justify" && rawBody && showPage) {
    // Body a la izquierda, N° de página a la derecha — dos Text fixed separados
    return (
      <>
        <Text
          fixed
          style={{ ...baseStyle, right: undefined, textAlign: "left" }}
          render={() => resolvedBody}
        />
        <Text
          fixed
          style={{ ...baseStyle, left: undefined, textAlign: "right" }}
          render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} de ${totalPages}`}
        />
      </>
    );
  }

  // Solo N° de página (sin texto)
  if (!rawBody && showPage) {
    return (
      <Text
        style={{ ...baseStyle, textAlign: "center" }}
        fixed
        render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} de ${totalPages}`}
      />
    );
  }

  // Solo texto (sin N° de página) o centrado con ambos
  return (
    <Text
      style={{ ...baseStyle, textAlign: "center" }}
      fixed
      render={({ pageNumber, totalPages }) => {
        if (!rawBody) return "";
        if (showPage) return `${resolvedBody} · Pág. ${pageNumber} de ${totalPages}`;
        return resolvedBody;
      }}
    />
  );
}

function renderBlock(
  blockId: string,
  layout: QuotationTemplateLayout,
  data: QuotationPdfData,
  styles: ReturnType<typeof buildStyles>,
) {
  if (isCustomSectionId(blockId)) {
    return (
      <CustomSectionBlock
        key={blockId}
        layout={layout}
        blockId={blockId}
        data={data}
        styles={styles}
      />
    );
  }
  switch (blockId) {
    case "company":
      return <CompanyBlock key={blockId} layout={layout} data={data} styles={styles} />;
    case "quote_meta":
      return <QuoteMetaBlock key={blockId} layout={layout} data={data} />;
    case "client":
      return <ClientBlock key={blockId} layout={layout} data={data} styles={styles} />;
    case "custom_fields":
      return <CustomFieldsBlock key={blockId} layout={layout} data={data} styles={styles} />;
    case "lines":
      return <LinesBlock key={blockId} layout={layout} data={data} styles={styles} />;
    case "totals":
      return (
        <TotalsBlock
          key={blockId}
          layout={layout}
          data={data}
          styles={styles}
          discountMode={data.discountMode}
        />
      );
    case "terms":
      return <TermsBlock key={blockId} layout={layout} styles={styles} />;
    case "signature":
      return <SignatureBlock key={blockId} layout={layout} styles={styles} />;
    case "footer":
      return null;
    default:
      return null;
  }
}

function renderPageBlocks(
  order: string[],
  layout: QuotationTemplateLayout,
  data: QuotationPdfData,
  styles: ReturnType<typeof buildStyles>,
) {
  const enabled = order.filter((id) => id !== "footer");
  const showLines = enabled.includes("lines");
  const showTotals = enabled.includes("totals");

  return enabled.flatMap((id) => {
    if (id === "totals" && showLines) {
      return [];
    }
    if (id === "lines") {
      return [
        <View key="lines-and-totals" wrap={false} style={{ marginTop: 12 }}>
          <LinesBlock layout={layout} data={data} styles={styles} />
          {showTotals ? (
            <TotalsBlock
              layout={layout}
              data={data}
              styles={styles}
              discountMode={data.discountMode}
            />
          ) : null}
        </View>,
      ];
    }
    const block = renderBlock(id, layout, data, styles);
    return block ? [block] : [];
  });
}

export function QuotationPdfFromTemplate({
  layout,
  data,
}: Readonly<{
  layout: QuotationTemplateLayout;
  data: QuotationPdfData;
}>) {
  const styles = buildStyles(layout.accentColor);
  const order = orderedEnabledBlocks(layout);
  const showFooter = order.includes("footer");

  return (
    <Page size="A4" style={styles.page}>
      {renderPageBlocks(order, layout, data, styles)}
      {showFooter ? <FooterBlock layout={layout} data={data} styles={styles} /> : null}
    </Page>
  );
}

export function QuotationPdfDocumentFromTemplate({
  layout,
  data,
}: Readonly<{
  layout: QuotationTemplateLayout;
  data: QuotationPdfData;
}>) {
  return (
    <Document>
      <QuotationPdfFromTemplate layout={layout} data={data} />
    </Document>
  );
}
