import type { Business, Customer } from "@/db/schema";
import { formatDate, formatMoney, formatNumber } from "@/lib/money";
import { StatusBadge } from "@/components/ui";

export type PreviewItem = { id?: string; description: string; quantity: string; unitPricePence: number };

export function DocumentPreview({
  kind,
  business,
  customer,
  number,
  title,
  issueDate,
  secondDate,
  secondLabel,
  items,
  taxRate,
  subtotalPence,
  taxPence,
  totalPence,
  notes,
  terms,
  status,
  amountPaidPence,
}: {
  kind: "quotation" | "invoice";
  business: Business;
  customer: Pick<Customer, "name" | "phone" | "email" | "address">;
  number: string;
  title: string;
  issueDate: string;
  secondDate: string;
  secondLabel: string;
  items: PreviewItem[];
  taxRate: number;
  subtotalPence: number;
  taxPence: number;
  totalPence: number;
  notes?: string;
  terms?: string;
  status: string;
  amountPaidPence?: number;
}) {
  const paid = amountPaidPence ?? 0;
  const balance = totalPence - paid;
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-card)]">
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400" />
      <div className="p-5 sm:p-7">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-[15px] font-black text-white">
                {business.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-[15px] leading-tight font-extrabold text-slate-900">{business.name}</p>
                <p className="text-[11px] text-slate-500">
                  {[business.city, business.postcode].filter(Boolean).join(" ") || "United Kingdom"}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-0.5 text-[11.5px] text-slate-500">
              {business.address ? <p>{business.address}</p> : null}
              {business.phone ? <p>{business.phone}</p> : null}
              {business.email ? <p>{business.email}</p> : null}
              {business.vatNumber ? <p>VAT: {business.vatNumber}</p> : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10.5px] font-bold tracking-[0.16em] text-brand-600 uppercase">
              {kind === "quotation" ? "Quotation" : "Invoice"}
            </p>
            <p className="text-[19px] font-extrabold text-slate-900">{number}</p>
            <div className="mt-1.5 flex justify-end">
              <StatusBadge status={status} kind={kind === "invoice" ? "invoice" : "quote"} />
            </div>
            <p className="mt-2 text-[11.5px] text-slate-500">Issued {formatDate(issueDate)}</p>
            <p className="text-[11.5px] text-slate-500">
              {secondLabel} {formatDate(secondDate)}
            </p>
          </div>
        </header>

        <div className="grid gap-4 border-b border-slate-100 py-5 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
              {kind === "quotation" ? "Prepared for" : "Billed to"}
            </p>
            <p className="mt-1 text-[14px] font-bold text-slate-900">{customer.name}</p>
            <div className="mt-0.5 space-y-0.5 text-[11.5px] text-slate-500">
              {customer.address ? <p>{customer.address}</p> : null}
              {customer.phone ? <p>{customer.phone}</p> : null}
              {customer.email ? <p>{customer.email}</p> : null}
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">Summary</p>
            <p className="mt-1 text-[13.5px] font-semibold text-slate-800">{title}</p>
            <p className="mt-1 text-[11.5px] text-slate-500">
              {items.length} {items.length === 1 ? "line item" : "line items"} · VAT {taxRate}%
            </p>
          </div>
        </div>

        <div className="py-4">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Unit</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const quantity = Number(item.quantity);
                return (
                  <tr key={item.id ?? index} className="text-[13px]">
                    <td className="py-2.5 pr-2 text-slate-700">{item.description}</td>
                    <td className="py-2.5 text-center text-slate-500">{formatNumber(quantity)}</td>
                    <td className="py-2.5 text-right text-slate-500">{formatMoney(item.unitPricePence)}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">
                      {formatMoney(Math.round(quantity * item.unitPricePence))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
          <div className="max-w-sm space-y-2 text-[11.5px] leading-relaxed text-slate-500">
            {notes ? (
              <div>
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Notes</p>
                <p className="mt-0.5 whitespace-pre-line text-slate-600">{notes}</p>
              </div>
            ) : null}
            {terms ? (
              <div>
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Terms</p>
                <p className="mt-0.5 whitespace-pre-line text-slate-600">{terms}</p>
              </div>
            ) : null}
          </div>
          <div className="w-full sm:max-w-[240px]">
            <div className="flex justify-between text-[12.5px] text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold">{formatMoney(subtotalPence)}</span>
            </div>
            <div className="mt-1 flex justify-between text-[12.5px] text-slate-600">
              <span>VAT ({taxRate}%)</span>
              <span className="font-semibold">{formatMoney(taxPence)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-[15px] font-extrabold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(totalPence)}</span>
            </div>
            {kind === "invoice" ? (
              <>
                <div className="mt-1 flex justify-between text-[12.5px] text-emerald-700">
                  <span>Paid</span>
                  <span className="font-semibold">{formatMoney(paid)}</span>
                </div>
                <div className="mt-1 flex justify-between rounded-lg bg-slate-50 px-2 py-1.5 text-[13px] font-extrabold text-slate-900">
                  <span>Balance due</span>
                  <span>{formatMoney(balance)}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <footer className="mt-5 border-t border-slate-100 pt-3 text-center text-[10.5px] text-slate-400">
          {kind === "quotation"
            ? "This quotation is valid until the date shown. Thank you for the opportunity to quote."
            : "Thank you for your business. Please quote the invoice number with your payment."}
          {" · "}
          Generated with QuoteFlow
        </footer>
      </div>
    </article>
  );
}
