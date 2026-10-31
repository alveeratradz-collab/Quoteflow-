import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { CalendarClock, FileText, Info, MessageCircle, ReceiptText, Sparkles } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getWhatsAppQueue } from "@/lib/queries";
import { formatDate, formatDateTime, formatMoney } from "@/lib/money";
import { WhatsAppButton } from "@/components/share-actions";
import { EmptyState, PageHeader } from "@/components/ui";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "WhatsApp follow-ups" };

export default async function WhatsAppPage() {
  const { business } = await requireAuth();
  const queue = await getWhatsAppQueue(business.id);
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  return (
    <div>
      <PageHeader
        eyebrow="Follow up & get paid"
        title="WhatsApp centre"
        description="One tap opens WhatsApp with a friendly, ready-to-send message. No Business API needed."
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-[12.5px] font-medium text-brand-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Messages open in WhatsApp (app or web) on your device. Your customer&apos;s number and quote link are
        filled in for you — you can edit before sending.
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3.5">
            <FileText className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <h2 className="text-[15px] font-bold text-slate-900">Quotes to chase</h2>
            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
              {queue.pendingQuotes.length}
            </span>
          </header>
          {queue.pendingQuotes.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
              title="Nothing waiting"
              description="Every quotation has been decided. Nice work!"
              action={<Link href="/quotations/new" className="btn-secondary">Create a quote</Link>}
            />
          ) : (
            <ul className="divide-row">
              {queue.pendingQuotes.map((quote) => {
                const message = `Hello ${quote.customerName.split(" ")[0]}, just following up on quotation ${quote.number} from ${business.name} — ${formatMoney(quote.totalPence)}.\n\nView it here: ${origin}/q/${quote.shareToken}\n\nHappy to answer any questions or adjust anything.`;
                return (
                  <li key={quote.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/quotations/${quote.id}`} className="truncate text-[13.5px] font-semibold text-slate-800 hover:text-brand-700">
                        {quote.title}
                      </Link>
                      <p className="text-[11.5px] text-slate-500">
                        {quote.number} · {quote.customerName} · sent {formatDate(quote.issueDate)} ·{" "}
                        {formatMoney(quote.totalPence)}
                      </p>
                    </div>
                    <WhatsAppButton
                      phone={quote.customerPhone}
                      message={message}
                      label="Follow up"
                      className="btn-secondary px-3 py-1.5 text-[12px]"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3.5">
            <ReceiptText className="h-4 w-4 text-rose-500" aria-hidden="true" />
            <h2 className="text-[15px] font-bold text-slate-900">Unpaid invoices</h2>
          </header>
          {queue.unpaidInvoices.length === 0 ? (
            <EmptyState icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />} title="All paid up" description="No outstanding invoices right now." />
          ) : (
            <ul className="divide-row">
              {queue.unpaidInvoices.map((invoice) => {
                const due = invoice.totalPence - invoice.amountPaidPence;
                const message = `Hi ${invoice.customerName.split(" ")[0]}, a quick reminder that invoice ${invoice.number} from ${business.name} (${formatMoney(due)}) is still outstanding and was due ${formatDate(invoice.dueDate)}.\n\nInvoice: ${origin}/i/${invoice.shareToken}\n\nThank you!`;
                return (
                  <li key={invoice.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/invoices/${invoice.id}`} className="truncate text-[13px] font-semibold text-slate-800 hover:text-brand-700">
                          {invoice.number}
                        </Link>
                        <p className="text-[11.5px] text-slate-500">
                          {invoice.customerName} · due {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <span className="text-[12.5px] font-bold text-rose-600">{formatMoney(due)}</span>
                    </div>
                    <WhatsAppButton
                      phone={invoice.customerPhone}
                      message={message}
                      label="Remind"
                      className="btn-secondary mt-2 w-full px-3 py-1.5 text-[11.5px]"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card lg:col-span-2">
          <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3.5">
            <CalendarClock className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <h2 className="text-[15px] font-bold text-slate-900">Upcoming appointments</h2>
          </header>
          {queue.upcomingJobs.length === 0 ? (
            <EmptyState icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />} title="No appointments booked" description="Book a job to send confirmations." />
          ) : (
            <ul className="divide-row">
              {queue.upcomingJobs.map((job) => {
                const message = `Hi ${job.customerName.split(" ")[0]}, your job with ${business.name} is booked${
                  job.scheduledAt ? ` for ${formatDateTime(job.scheduledAt)}` : ""
                }. We'll message you when we're on the way. Thank you!`;
                return (
                  <li key={job.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{job.title}</p>
                      <p className="text-[11.5px] text-slate-500">
                        {job.customerName} · {job.scheduledAt ? formatDateTime(job.scheduledAt) : "unscheduled"}
                      </p>
                    </div>
                    <WhatsAppButton
                      phone={job.customerPhone}
                      message={message}
                      label="Confirm"
                      className="btn-secondary px-3 py-1.5 text-[12px]"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card card-pad">
          <h2 className="mb-1 flex items-center gap-1.5 text-[15px] font-bold text-slate-900">
            <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Message templates
          </h2>
          <p className="mb-3 text-[12px] text-slate-500">Ready-made wording — edit before sending.</p>
          <ul className="space-y-2">
            {WHATSAPP_TEMPLATES.map((template) => (
              <li key={template.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-[12.5px] font-bold text-slate-800">{template.label}</p>
                <p className="mt-0.5 text-[11.5px] text-slate-500">{template.description}</p>
                <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-relaxed text-slate-600">
                  {template.build({ customerName: "Sarah", businessName: business.name, reference: "QT-2026-001", amount: formatMoney(42000) })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
