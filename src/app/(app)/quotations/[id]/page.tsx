import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  MessageCircle,
  Pencil,
  ReceiptText,
  Trash2,
  XCircle,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getCustomerOptions, getQuotation } from "@/lib/queries";
import {
  convertQuotationToInvoiceAction,
  deleteQuotationAction,
  duplicateQuotationAction,
  updateQuotationStatusAction,
} from "@/app/actions/quotations";
import { formatDate, formatMoney } from "@/lib/money";
import { Alert, StatusBadge } from "@/components/ui";
import { DocumentPreview } from "@/components/document-preview";
import { DocumentForm } from "@/components/document-forms";
import { ConfirmSubmit, Drawer } from "@/components/interactive";
import { CopyLinkButton, DownloadPdfLink, WhatsAppButton } from "@/components/share-actions";

export const metadata: Metadata = { title: "Quotation" };

export default async function QuotationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { business } = await requireAuth();
  const { id } = await params;
  const query = await searchParams;
  const data = await getQuotation(business.id, id);
  if (!data || !data.customer) notFound();
  const customers = await getCustomerOptions(business.id);
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const shareUrl = `${proto}://${host}/q/${data.quote.shareToken}`;
  const firstName = data.customer.name.split(" ")[0];
  const whatsappMessage = `Hello ${firstName}, your quotation ${data.quote.number} from ${business.name} is ready — total ${formatMoney(data.quote.totalPence)}.\n\nView it here: ${shareUrl}\n\nLet me know if you'd like to go ahead.`;

  return (
    <div>
      <Link href="/quotations" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to quotations
      </Link>

      {query.created ? (
        <div className="mb-4">
          <Alert tone="success">
            Quotation created. Send it on WhatsApp or download the PDF — then mark it accepted once the customer agrees.
          </Alert>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[21px] leading-tight font-extrabold tracking-tight text-slate-900">{data.quote.title}</h1>
            <StatusBadge status={data.quote.status} />
          </div>
          <p className="mt-1 text-[12.5px] text-slate-500">
            {data.quote.number} ·{" "}
            <Link href={`/customers/${data.customer.id}`} className="font-semibold text-brand-600 hover:text-brand-700">
              {data.customer.name}
            </Link>{" "}
            · issued {formatDate(data.quote.issueDate)} · valid until {formatDate(data.quote.validUntil)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WhatsAppButton phone={data.customer.phone} message={whatsappMessage} label="Send on WhatsApp" />
          <DownloadPdfLink href={`/api/quotations/${data.quote.id}/pdf`} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <DocumentPreview
            kind="quotation"
            business={business}
            customer={data.customer}
            number={data.quote.number}
            title={data.quote.title}
            issueDate={data.quote.issueDate}
            secondDate={data.quote.validUntil}
            secondLabel="Valid until"
            items={data.items}
            taxRate={data.quote.taxRate}
            subtotalPence={data.quote.subtotalPence}
            taxPence={data.quote.taxPence}
            totalPence={data.quote.totalPence}
            notes={data.quote.notes}
            terms={data.quote.terms}
            status={data.quote.status}
          />
        </div>

        <aside className="space-y-3">
          <section className="card card-pad">
            <h2 className="mb-2 text-[13.5px] font-bold text-slate-900">Next step</h2>
            <div className="space-y-2">
              <form action={updateQuotationStatusAction}>
                <input type="hidden" name="id" value={data.quote.id} />
                <input type="hidden" name="status" value="sent" />
                <button type="submit" className="btn-secondary w-full justify-start text-[12.5px]">
                  <MessageCircle className="h-4 w-4 text-brand-600" aria-hidden="true" /> Mark as sent
                </button>
              </form>
              <form action={updateQuotationStatusAction}>
                <input type="hidden" name="id" value={data.quote.id} />
                <input type="hidden" name="status" value="accepted" />
                <button type="submit" className="btn-secondary w-full justify-start text-[12.5px] text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Mark accepted
                </button>
              </form>
              <form action={updateQuotationStatusAction}>
                <input type="hidden" name="id" value={data.quote.id} />
                <input type="hidden" name="status" value="rejected" />
                <button type="submit" className="btn-secondary w-full justify-start text-[12.5px] text-rose-700">
                  <XCircle className="h-4 w-4 text-rose-500" aria-hidden="true" /> Mark rejected
                </button>
              </form>
              <form action={convertQuotationToInvoiceAction}>
                <input type="hidden" name="id" value={data.quote.id} />
                <button type="submit" className="btn-primary w-full text-[12.5px]">
                  <ReceiptText className="h-4 w-4" aria-hidden="true" /> Convert to invoice
                </button>
              </form>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="mb-2 text-[13.5px] font-bold text-slate-900">Share &amp; save</h2>
            <div className="space-y-2">
              <CopyLinkButton value={shareUrl} label="Copy customer link" className="btn-secondary w-full justify-start text-[12.5px]" />
              <Link href={`/q/${data.quote.shareToken}`} target="_blank" className="btn-secondary w-full justify-start text-[12.5px]">
                <FileText className="h-4 w-4" aria-hidden="true" /> Preview customer view
              </Link>
              <a href={`/api/quotations/${data.quote.id}/pdf`} download className="btn-secondary w-full justify-start text-[12.5px]">
                <Download className="h-4 w-4" aria-hidden="true" /> Download PDF
              </a>
              <Drawer
                triggerLabel="Edit quotation"
                triggerIcon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                triggerClassName="btn-secondary w-full justify-start text-[12.5px]"
                title="Edit quotation"
                description={`${data.quote.number} · changes recalculate the totals`}
                wide
              >
                <DocumentForm
                  kind="quotation"
                  customers={customers}
                  businessTaxRate={business.taxRate}
                  initialValues={{
                    id: data.quote.id,
                    customerId: data.quote.customerId,
                    title: data.quote.title,
                    issueDate: data.quote.issueDate,
                    secondDate: data.quote.validUntil,
                    taxRate: data.quote.taxRate,
                    status: data.quote.status,
                    notes: data.quote.notes,
                    terms: data.quote.terms,
                    items: data.items.map((item) => ({
                      description: item.description,
                      quantity: item.quantity,
                      unitPricePence: item.unitPricePence,
                    })),
                  }}
                />
              </Drawer>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="mb-2 text-[13.5px] font-bold text-slate-900">Amounts</h2>
            <div className="flex justify-between py-1 text-[12.5px] text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold">{formatMoney(data.quote.subtotalPence)}</span>
            </div>
            <div className="flex justify-between py-1 text-[12.5px] text-slate-600">
              <span>VAT ({data.quote.taxRate}%)</span>
              <span className="font-semibold">{formatMoney(data.quote.taxPence)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-slate-100 pt-2 text-[14px] font-extrabold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(data.quote.totalPence)}</span>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="mb-2 text-[13.5px] font-bold text-slate-900">More actions</h2>
            <form action={duplicateQuotationAction} className="mb-2">
              <input type="hidden" name="id" value={data.quote.id} />
              <button type="submit" className="btn-secondary w-full justify-start text-[12.5px]">
                <Copy className="h-4 w-4" aria-hidden="true" /> Duplicate as draft
              </button>
            </form>
            <form action={deleteQuotationAction}>
              <input type="hidden" name="id" value={data.quote.id} />
              <ConfirmSubmit message="Delete this quotation permanently?" className="btn-danger w-full justify-start text-[12.5px]">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete quotation
              </ConfirmSubmit>
            </form>
          </section>

          <Link
            href={`/customers/${data.customer.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-slate-700 hover:border-brand-300"
          >
            View customer history <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
