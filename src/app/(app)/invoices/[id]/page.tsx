import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Download,
  MessageCircle,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getInvoice } from "@/lib/queries";
import { deleteInvoiceAction, markInvoicePaidAction } from "@/app/actions/invoices";
import { formatDate, formatDateTime, formatMoney, isOverdue } from "@/lib/money";
import { Alert, StatusBadge } from "@/components/ui";
import { DocumentPreview } from "@/components/document-preview";
import { PaymentForm } from "@/components/payment-form";
import { ConfirmSubmit } from "@/components/interactive";
import { CopyLinkButton, DownloadPdfLink, WhatsAppButton } from "@/components/share-actions";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; fromQuote?: string; exists?: string }>;
}) {
  const { business } = await requireAuth();
  const { id } = await params;
  const query = await searchParams;
  const data = await getInvoice(business.id, id);
  if (!data || !data.customer) notFound();

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const shareUrl = `${proto}://${host}/i/${data.invoice.shareToken}`;
  const outstanding = Math.max(0, data.invoice.totalPence - data.invoice.amountPaidPence);
  const overdue = isOverdue(
    data.invoice.dueDate,
    data.invoice.status,
    data.invoice.amountPaidPence,
    data.invoice.totalPence,
  );
  const displayStatus = overdue ? "overdue" : data.invoice.status;
  const firstName = data.customer.name.split(" ")[0];
  const reminder = `Hi ${firstName}, a quick reminder that invoice ${data.invoice.number} from ${business.name}${
    outstanding > 0 ? ` (${formatMoney(outstanding)})` : ""
  } is outstanding and was due ${formatDate(data.invoice.dueDate)}.\n\nInvoice: ${shareUrl}\n\nThank you!`;
  const receipt = `Hi ${firstName}, thank you — we've received your payment for invoice ${data.invoice.number}. It's much appreciated. — ${business.name}`;

  return (
    <div>
      <Link href="/invoices" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to invoices
      </Link>

      {query.created ? (
        <div className="mb-4"><Alert tone="success">Invoice {query.created} created. Send it on WhatsApp or download the PDF.</Alert></div>
      ) : null}
      {query.fromQuote ? (
        <div className="mb-4"><Alert tone="success">Quotation accepted and converted into an invoice.</Alert></div>
      ) : null}
      {query.exists ? (
        <div className="mb-4"><Alert tone="info">This quotation already has an invoice — you&apos;re viewing it.</Alert></div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[21px] leading-tight font-extrabold tracking-tight text-slate-900">{data.invoice.number}</h1>
            <StatusBadge status={displayStatus} kind="invoice" />
          </div>
          <p className="mt-1 text-[12.5px] text-slate-500">
            {data.invoice.title} ·{" "}
            <Link href={`/customers/${data.customer.id}`} className="font-semibold text-brand-600 hover:text-brand-700">
              {data.customer.name}
            </Link>{" "}
            · due {formatDate(data.invoice.dueDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.invoice.status !== "paid" ? (
            <WhatsAppButton phone={data.customer.phone} message={reminder} label="Send reminder" />
          ) : (
            <WhatsAppButton phone={data.customer.phone} message={receipt} label="Send receipt thanks" className="btn-secondary" />
          )}
          <DownloadPdfLink href={`/api/invoices/${data.invoice.id}/pdf`} />
        </div>
      </div>

      {overdue ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-medium text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          This invoice is overdue. Send a polite WhatsApp reminder or record a payment below.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <DocumentPreview
            kind="invoice"
            business={business}
            customer={data.customer}
            number={data.invoice.number}
            title={data.invoice.title}
            issueDate={data.invoice.issueDate}
            secondDate={data.invoice.dueDate}
            secondLabel="Due"
            items={data.items}
            taxRate={data.invoice.taxRate}
            subtotalPence={data.invoice.subtotalPence}
            taxPence={data.invoice.taxPence}
            totalPence={data.invoice.totalPence}
            notes={data.invoice.notes}
            status={data.invoice.status}
            amountPaidPence={data.invoice.amountPaidPence}
          />
        </div>

        <aside className="space-y-3">
          <section className="card card-pad">
            <div className="flex items-center justify-between">
              <h2 className="text-[13.5px] font-bold text-slate-900">Balance</h2>
              <Wallet className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <p className={`mt-1 text-2xl font-extrabold ${outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {formatMoney(outstanding)}
            </p>
            <p className="text-[11.5px] text-slate-500">
              {formatMoney(data.invoice.amountPaidPence)} of {formatMoney(data.invoice.totalPence)} paid
            </p>
            {outstanding > 0 ? (
              <div className="mt-3">
                <PaymentForm invoiceId={data.invoice.id} outstandingPence={outstanding} />
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12.5px] font-semibold text-emerald-800">
                Paid in full — nothing outstanding.
              </div>
            )}
            {outstanding > 0 ? (
              <form action={markInvoicePaidAction} className="mt-2">
                <input type="hidden" name="id" value={data.invoice.id} />
                <button type="submit" className="btn-secondary w-full text-[12.5px]">
                  Mark as fully paid
                </button>
              </form>
            ) : null}
          </section>

          <section className="card card-pad">
            <h2 className="mb-2 text-[13.5px] font-bold text-slate-900">Payment history</h2>
            {data.payments.length === 0 ? (
              <p className="text-[12px] text-slate-500">No payments recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.payments.map((payment) => (
                  <li key={payment.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="font-bold text-slate-800">{formatMoney(payment.amountPence)}</span>
                      <span className="capitalize text-slate-500">{payment.method.replace("_", " ")}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-400">
                      {formatDateTime(payment.paidAt)}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card card-pad">
            <h2 className="mb-2 text-[13.5px] font-bold text-slate-900">Share</h2>
            <div className="space-y-2">
              <CopyLinkButton value={shareUrl} label="Copy invoice link" className="btn-secondary w-full justify-start text-[12.5px]" />
              <Link href={`/i/${data.invoice.shareToken}`} target="_blank" className="btn-secondary w-full justify-start text-[12.5px]">
                <ReceiptText className="h-4 w-4" aria-hidden="true" /> Preview customer view
              </Link>
              <a href={`/api/invoices/${data.invoice.id}/pdf`} download className="btn-secondary w-full justify-start text-[12.5px]">
                <Download className="h-4 w-4" aria-hidden="true" /> Download PDF
              </a>
              <WhatsAppButton
                phone={data.customer.phone}
                message={`Hi ${firstName}, thanks for choosing ${business.name}. You can view invoice ${data.invoice.number} here: ${shareUrl}`}
                label="Send invoice on WhatsApp"
                className="btn-secondary w-full justify-start text-[12.5px]"
              />
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="mb-2 text-[13.5px] font-bold text-slate-900">Manage</h2>
            <form action={deleteInvoiceAction}>
              <input type="hidden" name="id" value={data.invoice.id} />
              <ConfirmSubmit message="Delete this invoice permanently?" className="btn-danger w-full justify-start text-[12.5px]">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete invoice
              </ConfirmSubmit>
            </form>
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Copy className="h-3 w-3" aria-hidden="true" /> Payments are kept with the customer history
            </p>
          </section>

          <Link
            href={`/customers/${data.customer.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-slate-700 hover:border-brand-300"
          >
            View customer history <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
