"use client";

import { pdf } from "@react-pdf/renderer";
import { useEffect, useRef, useState } from "react";

import { QuotationPdfDocumentFromTemplate } from "@/components/cotizaciones/quotation-pdf-from-template";
import type { QuotationPdfData } from "@/lib/quotations/quotation-pdf-types";
import type { QuotationTemplateLayout } from "@/lib/quotations/template-schema";

const FRAME_HEIGHT = "min(70vh, 640px)";

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "error" };

export function QuotationTemplatePreview({
  layout,
  data,
}: Readonly<{
  layout: QuotationTemplateLayout;
  data: QuotationPdfData;
}>) {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const prevUrlRef = useRef<string | null>(null);
  // Cada render de layout/data crea una nueva "generación"; las anteriores se descartan.
  const genRef = useRef(0);

  const layoutStr = JSON.stringify(layout);
  const dataStr = JSON.stringify(data);

  useEffect(() => {
    const thisGen = ++genRef.current;
    setState({ status: "loading" });

    pdf(<QuotationPdfDocumentFromTemplate layout={layout} data={data} />)
      .toBlob()
      .then((blob) => {
        if (thisGen !== genRef.current) return; // generación superada, descartar
        const url = URL.createObjectURL(blob);
        setState({ status: "ready", url });

        const old = prevUrlRef.current;
        prevUrlRef.current = url;
        if (old) setTimeout(() => URL.revokeObjectURL(old), 2000);
      })
      .catch(() => {
        if (thisGen === genRef.current) setState({ status: "error" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutStr, dataStr]);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  if (state.status === "error") {
    return (
      <div
        className="text-destructive flex items-center justify-center rounded-xl border border-dashed px-4 text-sm"
        style={{ height: FRAME_HEIGHT }}
        role="alert"
      >
        No se pudo generar la vista previa.
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div
        className="text-muted-foreground flex items-center justify-center rounded-xl border border-dashed text-sm"
        style={{ height: FRAME_HEIGHT }}
      >
        Generando vista previa…
      </div>
    );
  }

  return (
    <div className="border-border bg-muted/30 overflow-hidden rounded-xl border">
      <iframe
        key={state.url}
        src={`${state.url}#toolbar=0&navpanes=0`}
        title="Vista previa del PDF de cotización"
        className="w-full border-0 bg-white"
        style={{ height: FRAME_HEIGHT, display: "block" }}
      />
    </div>
  );
}
