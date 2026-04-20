import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { sessionHasPermission } from "@/lib/auth/check-permission";
import { getQuotationForCompany } from "@/lib/data/quotations";
import {
  quotationPdfAttachmentFilename,
  renderQuotationPdfBuffer,
} from "@/lib/quotations/render-quotation-pdf";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.activeCompanyId) {
    return new Response("No autorizado", { status: 401 });
  }
  const ok = await sessionHasPermission(session, "cotizaciones", "read");
  if (!ok) {
    return new Response("No autorizado", { status: 401 });
  }

  const { id } = await context.params;
  const q = await getQuotationForCompany(id, session.activeCompanyId);
  if (!q) {
    return new Response("No encontrado", { status: 404 });
  }

  const buffer = await renderQuotationPdfBuffer(q);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quotationPdfAttachmentFilename(q)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
