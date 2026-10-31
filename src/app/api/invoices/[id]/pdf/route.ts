import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getInvoice } from "@/lib/queries";
import { buildDocumentPdf } from "@/lib/pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;
  const data = await getInvoice(auth.business.id, id);
  if (!data || !data.customer) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const bytes = await buildDocumentPdf({
    kind: "invoice",
    business: data.business ?? auth.business,
    customer: data.customer,
    number: data.invoice.number,
    title: data.invoice.title,
    issueDate: data.invoice.issueDate,
    secondDate: data.invoice.dueDate,
    secondLabel: "Due",
    items: data.items,
    taxRate: data.invoice.taxRate,
    subtotalPence: data.invoice.subtotalPence,
    taxPence: data.invoice.taxPence,
    totalPence: data.invoice.totalPence,
    notes: data.invoice.notes,
    status: data.invoice.status,
    amountPaidPence: data.invoice.amountPaidPence,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.invoice.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
