import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getQuotation } from "@/lib/queries";
import { buildDocumentPdf } from "@/lib/pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;
  const data = await getQuotation(auth.business.id, id);
  if (!data || !data.customer) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const bytes = await buildDocumentPdf({
    kind: "quotation",
    business: data.business ?? auth.business,
    customer: data.customer,
    number: data.quote.number,
    title: data.quote.title,
    issueDate: data.quote.issueDate,
    secondDate: data.quote.validUntil,
    secondLabel: "Valid until",
    items: data.items,
    taxRate: data.quote.taxRate,
    subtotalPence: data.quote.subtotalPence,
    taxPence: data.quote.taxPence,
    totalPence: data.quote.totalPence,
    notes: data.quote.notes,
    terms: data.quote.terms,
    status: data.quote.status,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.quote.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
