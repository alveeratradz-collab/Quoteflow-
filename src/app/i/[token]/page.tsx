import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { businesses, customers, invoiceItems, invoices } from "@/db/schema";
import { DocumentPreview } from "@/components/document-preview";
import { Alert } from "@/components/ui";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Your invoice" };

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [row] = await db
    .select({ invoice: invoices, customer: customers, business: businesses })
    .from(invoices)
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .innerJoin(businesses, eq(businesses.id, invoices.businessId))
    .where(eq(invoices.shareToken, token))
    .limit(1);
  if (!row) notFound();

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, row.invoice.id))
    .orderBy(asc(invoiceItems.position));
  const outstanding = row.invoice.totalPence - row.invoice.amountPaidPence;
  const paidMessage = `Hello ${row.business.name}, I've paid invoice ${row.invoice.number} (${formatMoney(
    outstanding,
  )}). Thank you!`;

  return (
    <div className="min-h-dvh bg-slate-100/70">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-brand-600 uppercase">Invoice from</p>
            <p className="text-[15px] font-extrabold text-slate-900">{row.business.name}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-semibold text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Secure link
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-4">
        {row.invoice.status === "paid" ? (
          <div className="mb-4">
            <Alert tone="success">This invoice is paid in full. Thank you!</Alert>
          </div>
        ) : null}

        <DocumentPreview
          kind="invoice"
          business={row.business}
          customer={row.customer}
          number={row.invoice.number}
          title={row.invoice.title}
          issueDate={row.invoice.issueDate}
          secondDate={row.invoice.dueDate}
          secondLabel="Due"
          items={items}
          taxRate={row.invoice.taxRate}
          subtotalPence={row.invoice.subtotalPence}
          taxPence={row.invoice.taxPence}
          totalPence={row.invoice.totalPence}
          notes={row.invoice.notes}
          status={row.invoice.status}
          amountPaidPence={row.invoice.amountPaidPence}
        />

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-800">
            {outstanding <= 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Paid — nothing outstanding
              </>
            ) : (
              <>Balance due {formatMoney(outstanding)}</>
            )}
          </p>
          <p className="mt-0.5 text-[12.5px] text-slate-500">
            Bank transfer details are shown on the invoice. Please use {row.invoice.number} as the reference.
          </p>
          <a
            href={buildWhatsAppLink(row.business.phone, paidMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-3 w-full"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Message {row.business.name}
          </a>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          Powered by{" "}
          <Link href="/" className="font-semibold text-brand-600">
            QuoteFlow
          </Link>
        </p>
      </main>
    </div>
  );
}
