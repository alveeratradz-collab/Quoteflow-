import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight, Download, FileText, Plus, Search } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { listQuotations } from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/money";
import { Alert, EmptyState, LinkButton, PageHeader, StatusBadge } from "@/components/ui";
import { WhatsAppButton } from "@/components/share-actions";

export const metadata: Metadata = { title: "Quotations" };

const FILTERS = [
  { key: "", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "sent", label: "Sent" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; created?: string; deleted?: string }>;
}) {
  const { business } = await requireAuth();
  const params = await searchParams;
  const quotes = await listQuotations(business.id, params.status);
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const pendingValue = quotes
    .filter((quote) => quote.status === "draft" || quote.status === "sent")
    .reduce((sum, quote) => sum + quote.totalPence, 0);
  const acceptedValue = quotes
    .filter((quote) => quote.status === "accepted")
    .reduce((sum, quote) => sum + quote.totalPence, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Win the work"
        title="Quotations"
        description="Create, send and track professional quotes — then convert them into invoices."
        action={
          <LinkButton href="/quotations/new">
            <Plus className="h-4 w-4" aria-hidden="true" /> New quote
          </LinkButton>
        }
      />

      {params.created ? (
        <div className="mb-4">
          <Alert tone="success">Quotation {params.created} created. You can now send it on WhatsApp or download the PDF.</Alert>
        </div>
      ) : null}
      {params.deleted ? <div className="mb-4"><Alert tone="success">Quotation deleted.</Alert></div> : null}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="card card-pad">
          <p className="text-[10.5px] font-bold tracking-wide text-slate-400 uppercase">Awaiting decision</p>
          <p className="mt-1 text-lg font-extrabold text-brand-700">{formatMoney(pendingValue)}</p>
          <p className="text-[11.5px] text-slate-500">
            {quotes.filter((q) => q.status === "draft" || q.status === "sent").length} open quotes
          </p>
        </div>
        <div className="card card-pad">
          <p className="text-[10.5px] font-bold tracking-wide text-slate-400 uppercase">Accepted value</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-600">{formatMoney(acceptedValue)}</p>
          <p className="text-[11.5px] text-slate-500">
            {quotes.filter((q) => q.status === "accepted").length} won
          </p>
        </div>
      </div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((filter) => {
          const href = filter.key ? `/quotations?status=${filter.key}` : "/quotations";
          const active = (params.status ?? "") === filter.key;
          return (
            <Link key={filter.key || "all"} href={href} className={`chip shrink-0 ${active ? "chip-active" : ""}`}>
              {filter.label}
            </Link>
          );
        })}
      </div>

      {quotes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={params.status ? <Search className="h-5 w-5" aria-hidden="true" /> : <FileText className="h-5 w-5" aria-hidden="true" />}
            title={params.status ? "Nothing in this status" : "No quotations yet"}
            description={
              params.status
                ? "Try another filter, or create a new quotation."
                : "Your first quote takes about a minute: pick a customer, add your lines and send."
            }
            action={
              <LinkButton href="/quotations/new">
                <Plus className="h-4 w-4" aria-hidden="true" /> Create a quotation
              </LinkButton>
            }
          />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {quotes.map((quote) => {
            const message = `Hello ${quote.customerName.split(" ")[0]}, your quotation ${quote.number} from ${business.name} is ready — total ${formatMoney(quote.totalPence)}.\n\nView it here: ${origin}/q/${quote.shareToken}\n\nLet me know if you'd like to go ahead.`;
            return (
              <li key={quote.id} className="card card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/quotations/${quote.id}`} className="truncate text-[14.5px] font-bold text-slate-900 hover:text-brand-700">
                        {quote.title}
                      </Link>
                      <StatusBadge status={quote.status} />
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {quote.number} · {quote.customerName} · issued {formatDate(quote.issueDate)} · valid until{" "}
                      {formatDate(quote.validUntil)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-extrabold text-slate-900">{formatMoney(quote.totalPence)}</p>
                    <p className="text-[10.5px] text-slate-400">inc. VAT</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={`/quotations/${quote.id}`} className="btn-secondary py-1.5 text-[12px]">
                    Open <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <WhatsAppButton
                    phone={quote.customerPhone}
                    message={message}
                    label="WhatsApp"
                    className="btn-secondary py-1.5 text-[12px]"
                  />
                  <a href={`/api/quotations/${quote.id}/pdf`} className="btn-ghost py-1.5 text-[12px]" download>
                    <Download className="h-3.5 w-3.5" aria-hidden="true" /> PDF
                  </a>
                  {quote.status === "accepted" ? (
                    <Link href={`/invoices/new?quotationId=${quote.id}`} className="btn-ghost py-1.5 text-[12px] text-emerald-700">
                      Create invoice
                    </Link>
                  ) : null}
                  <Link href={`/q/${quote.shareToken}`} target="_blank" className="btn-ghost ml-auto py-1.5 text-[12px]">
                    Preview link
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
