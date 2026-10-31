import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Download, Plus, ReceiptText, Wallet } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { listInvoices } from "@/lib/queries";
import { formatDate, formatMoney, isOverdue } from "@/lib/money";
import { Alert, EmptyState, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { WhatsAppButton } from "@/components/share-actions";
import { markInvoicePaidAction } from "@/app/actions/invoices";

export const metadata: Metadata = { title: "Invoices" };

const FILTERS = [
  { key: "", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; created?: string; deleted?: string }>;
}) {
  const { business } = await requireAuth();
  const params = await searchParams;
  const all = await listInvoices(business.id);
  const rows = await listInvoices(business.id, params.status);
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const outstanding = all.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.totalPence - invoice.amountPaidPence),
    0,
  );
  const overdueCount = all.filter((invoice) =>
    isOverdue(invoice.dueDate, invoice.status, invoice.amountPaidPence, invoice.totalPence),
  ).length;
  const paidTotal = all.reduce((sum, invoice) => sum + invoice.amountPaidPence, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Get paid"
        title="Invoices"
        description="Track what's owed, record payments and send polite reminders on WhatsApp."
        action={
          <LinkButton href="/invoices/new">
            <Plus className="h-4 w-4" aria-hidden="true" /> New invoice
          </LinkButton>
        }
      />

      {params.deleted ? <div className="mb-4"><Alert tone="success">Invoice deleted.</Alert></div> : null}

      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <div className="card card-pad">
          <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Outstanding</p>
          <p className="mt-1 text-[17px] font-extrabold text-rose-600">{formatMoney(outstanding, { compact: true })}</p>
          <p className="text-[11px] text-slate-500">{all.filter((i) => i.status === "unpaid").length} open</p>
        </div>
        <div className="card card-pad">
          <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Overdue</p>
          <p className="mt-1 text-[17px] font-extrabold text-amber-600">{overdueCount}</p>
          <p className="text-[11px] text-slate-500">Chase these first</p>
        </div>
        <div className="card card-pad">
          <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Collected</p>
          <p className="mt-1 text-[17px] font-extrabold text-emerald-600">{formatMoney(paidTotal, { compact: true })}</p>
          <p className="text-[11px] text-slate-500">All time</p>
        </div>
      </div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((filter) => {
          const href = filter.key ? `/invoices?status=${filter.key}` : "/invoices";
          const active = (params.status ?? "") === filter.key;
          return (
            <Link key={filter.key || "all"} href={href} className={`chip shrink-0 ${active ? "chip-active" : ""}`}>
              {filter.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
            title={params.status ? "Nothing here" : "No invoices yet"}
            description={
              params.status
                ? "Try a different filter."
                : "Send your first invoice, or convert an accepted quotation in one tap."
            }
            action={
              <LinkButton href="/invoices/new">
                <Plus className="h-4 w-4" aria-hidden="true" /> Create an invoice
              </LinkButton>
            }
          />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((invoice) => {
            const overdue = isOverdue(invoice.dueDate, invoice.status, invoice.amountPaidPence, invoice.totalPence);
            const displayStatus = overdue ? "overdue" : invoice.status;
            const due = Math.max(0, invoice.totalPence - invoice.amountPaidPence);
            const reminder = `Hi ${invoice.customerName.split(" ")[0]}, a quick reminder that invoice ${invoice.number} from ${business.name}${
              due > 0 ? ` (${formatMoney(due)})` : ""
            } is outstanding and was due ${formatDate(invoice.dueDate)}.\n\nInvoice: ${origin}/i/${invoice.shareToken}\n\nThank you!`;
            return (
              <li key={invoice.id} className="card card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/invoices/${invoice.id}`} className="truncate text-[14.5px] font-bold text-slate-900 hover:text-brand-700">
                        {invoice.number} · {invoice.title}
                      </Link>
                      <StatusBadge status={displayStatus} kind="invoice" />
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {invoice.customerName} · issued {formatDate(invoice.issueDate)} · due {formatDate(invoice.dueDate)}
                    </p>
                    {overdue ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold text-rose-600">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Overdue — send a reminder
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-extrabold text-slate-900">{formatMoney(due)}</p>
                    <p className="text-[10.5px] text-slate-400">
                      {invoice.amountPaidPence > 0 ? `${formatMoney(invoice.amountPaidPence)} paid` : "balance due"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={`/invoices/${invoice.id}`} className="btn-secondary py-1.5 text-[12px]">
                    Open <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  {invoice.status !== "paid" ? (
                    <>
                      <WhatsAppButton
                        phone={invoice.customerPhone}
                        message={reminder}
                        label="Reminder"
                        className="btn-secondary py-1.5 text-[12px]"
                      />
                      <form action={markInvoicePaidAction}>
                        <input type="hidden" name="id" value={invoice.id} />
                        <button type="submit" className="btn-secondary py-1.5 text-[12px] text-emerald-700">
                          <Wallet className="h-3.5 w-3.5" aria-hidden="true" /> Mark paid
                        </button>
                      </form>
                    </>
                  ) : null}
                  <a href={`/api/invoices/${invoice.id}/pdf`} download className="btn-ghost py-1.5 text-[12px]">
                    <Download className="h-3.5 w-3.5" aria-hidden="true" /> PDF
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
