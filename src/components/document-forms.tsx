"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { createQuotationAction, updateQuotationAction } from "@/app/actions/quotations";
import { createInvoiceAction } from "@/app/actions/invoices";
import type { FormState } from "@/lib/validation";
import { formatMoney, parseMoneyToPence, todayISO, addDaysISO } from "@/lib/money";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export type CustomerOption = { id: string; name: string; phone: string; address: string };

type ItemRow = { key: string; description: string; quantity: string; unitPrice: string };

const initial: FormState = {};

const SUGGESTIONS = ["Call-out fee", "Labour (per hour)", "Parts & materials", "Site visit"];

export type DocumentInitial = {
  id?: string;
  customerId?: string;
  title?: string;
  issueDate?: string;
  secondDate?: string;
  taxRate?: number;
  status?: string;
  notes?: string;
  terms?: string;
  items?: { description: string; quantity: string; unitPricePence: number }[];
};

export function DocumentForm({
  kind,
  customers,
  businessTaxRate,
  defaultCustomerId,
  initialValues,
  quotationId,
}: {
  kind: "quotation" | "invoice";
  customers: CustomerOption[];
  businessTaxRate: number;
  defaultCustomerId?: string;
  initialValues?: DocumentInitial;
  quotationId?: string;
}) {
  const isEdit = Boolean(initialValues?.id);
  const action =
    kind === "invoice"
      ? createInvoiceAction
      : isEdit
        ? updateQuotationAction
        : createQuotationAction;
  const [state, formAction] = useActionState(action, initial);

  const [customerId, setCustomerId] = useState(initialValues?.customerId ?? defaultCustomerId ?? customers[0]?.id ?? "");
  const [taxRate, setTaxRate] = useState(String(initialValues?.taxRate ?? businessTaxRate));
  const [items, setItems] = useState<ItemRow[]>(() => {
    const existing = initialValues?.items ?? [];
    if (existing.length) {
      return existing.map((item, index) => ({
        key: `row-${index}`,
        description: item.description,
        quantity: String(Number(item.quantity)),
        unitPrice: (item.unitPricePence / 100).toFixed(2),
      }));
    }
    return [{ key: "row-0", description: "", quantity: "1", unitPrice: "" }];
  });

  const totals = useMemo(() => {
    const lines = items.map((item) => {
      const quantity = Number.parseFloat(item.quantity) || 0;
      const unitPricePence = parseMoneyToPence(item.unitPrice);
      return { quantity, unitPricePence, lineTotal: Math.round(quantity * unitPricePence) };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const rate = Math.max(0, Math.min(100, Number.parseFloat(taxRate) || 0));
    const tax = Math.round((subtotal * rate) / 100);
    return { lines, subtotal, tax, total: subtotal + tax, rate };
  }, [items, taxRate]);

  const itemsJson = JSON.stringify(
    items
      .filter((item) => item.description.trim() && (Number.parseFloat(item.quantity) || 0) > 0)
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number.parseFloat(item.quantity) || 0,
        unitPricePence: parseMoneyToPence(item.unitPrice),
      })),
  );

  const selectedCustomer = customers.find((customer) => customer.id === customerId);

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function addItem(description = "") {
    setItems((current) => [
      ...current,
      { key: `row-${Date.now()}-${current.length}`, description, quantity: "1", unitPrice: "" },
    ]);
  }

  function removeItem(key: string) {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.key !== key)));
  }

  return (
    <form action={formAction} className="space-y-4 pb-24 lg:pb-0" noValidate>
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}
      {quotationId ? <input type="hidden" name="quotationId" value={quotationId} /> : null}
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="taxRate" value={taxRate} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}
      {customers.length === 0 ? (
        <Alert tone="warning">
          You need a customer before creating a {kind}. Add one from the Customers page first.
        </Alert>
      ) : null}

      <section className="card card-pad">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="doc-customer">
              Customer <span className="text-rose-500">*</span>
            </label>
            <select
              id="doc-customer"
              name="customerId"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              className={`input ${state.fieldErrors?.customerId ? "input-error" : ""}`}
              required
            >
              <option value="">Choose a customer…</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} — {customer.phone}
                </option>
              ))}
            </select>
            {state.fieldErrors?.customerId ? (
              <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.customerId}</p>
            ) : null}
            {selectedCustomer?.address ? (
              <p className="mt-1 text-[11.5px] text-slate-400">{selectedCustomer.address}</p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="doc-title">
              {kind === "quotation" ? "Quote title" : "Invoice description"} <span className="text-rose-500">*</span>
            </label>
            <input
              id="doc-title"
              name="title"
              required
              defaultValue={initialValues?.title ?? ""}
              className={`input ${state.fieldErrors?.title ? "input-error" : ""}`}
              placeholder={kind === "quotation" ? "Bathroom tap replacement & service" : "Work completed in March"}
            />
            {state.fieldErrors?.title ? (
              <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.title}</p>
            ) : null}
          </div>

          <div>
            <label className="label" htmlFor="doc-issue">
              Issue date
            </label>
            <input
              id="doc-issue"
              name="issueDate"
              type="date"
              defaultValue={initialValues?.issueDate ?? todayISO()}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="doc-second">
              {kind === "quotation" ? "Valid until" : "Due date"}
            </label>
            <input
              id="doc-second"
              name={kind === "quotation" ? "validUntil" : "dueDate"}
              type="date"
              defaultValue={
                initialValues?.secondDate ?? (kind === "quotation" ? addDaysISO(30) : addDaysISO(14))
              }
              className="input"
            />
            {state.fieldErrors?.dueDate ? (
              <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.dueDate}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card card-pad">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">Services &amp; prices</h2>
            <p className="text-[12px] text-slate-500">Add each job as a line. Amounts exclude VAT.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            {items.length} {items.length === 1 ? "line" : "lines"}
          </span>
        </div>

        <div className="space-y-2.5">
          {items.map((item, index) => {
            const lineTotal = Math.round((Number.parseFloat(item.quantity) || 0) * parseMoneyToPence(item.unitPrice));
            return (
              <div key={item.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Line {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                    disabled={items.length === 1}
                    aria-label={`Remove line ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
                  </button>
                </div>
                <input
                  value={item.description}
                  onChange={(event) => updateItem(item.key, { description: event.target.value })}
                  className="input mb-2"
                  placeholder="Describe the work or part"
                  aria-label={`Description line ${index + 1}`}
                />
                <div className="grid grid-cols-[1fr_1.2fr_auto] items-end gap-2">
                  <div>
                    <label className="mb-1 block text-[10.5px] font-semibold tracking-wide text-slate-400 uppercase">
                      Qty
                    </label>
                    <input
                      value={item.quantity}
                      onChange={(event) => updateItem(item.key, { quantity: event.target.value })}
                      inputMode="decimal"
                      className="input py-2 text-[14px]"
                      aria-label={`Quantity line ${index + 1}`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10.5px] font-semibold tracking-wide text-slate-400 uppercase">
                      Unit price (£)
                    </label>
                    <input
                      value={item.unitPrice}
                      onChange={(event) => updateItem(item.key, { unitPrice: event.target.value })}
                      inputMode="decimal"
                      className="input py-2 text-[14px]"
                      placeholder="0.00"
                      aria-label={`Unit price line ${index + 1}`}
                    />
                  </div>
                  <span className="pb-2 text-[13px] font-bold text-slate-700">{formatMoney(lineTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={() => addItem()} className="btn-secondary mt-3 w-full border-dashed">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add another line
        </button>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addItem(suggestion)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      </section>

      <section className="card card-pad">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="doc-tax">
              VAT / tax rate (%)
            </label>
            <input
              id="doc-tax"
              value={taxRate}
              onChange={(event) => setTaxRate(event.target.value)}
              inputMode="numeric"
              className="input"
            />
          </div>
          {kind === "quotation" ? (
            <div>
              <label className="label" htmlFor="doc-status">
                Status
              </label>
              <select
                id="doc-status"
                name="status"
                defaultValue={initialValues?.status ?? "draft"}
                className="input"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent to customer</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Amount due</p>
              <p className="text-lg font-extrabold text-slate-900">{formatMoney(totals.total)}</p>
              <p className="text-[11px] text-slate-500">Tracked as unpaid until payments are recorded.</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="doc-notes">
              Message to customer
            </label>
            <textarea
              id="doc-notes"
              name="notes"
              rows={2}
              defaultValue={initialValues?.notes ?? ""}
              className="input"
              placeholder="Thanks for the opportunity — let me know if you have any questions."
            />
          </div>
          {kind === "quotation" ? (
            <div className="sm:col-span-2">
              <label className="label" htmlFor="doc-terms">
                Terms
              </label>
              <textarea
                id="doc-terms"
                name="terms"
                rows={2}
                defaultValue={initialValues?.terms ?? "50% deposit on acceptance. Work guaranteed for 12 months."}
                className="input"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
          <div className="flex justify-between text-[13px] text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold">{formatMoney(totals.subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-[13px] text-slate-600">
            <span>VAT ({totals.rate}%)</span>
            <span className="font-semibold">{formatMoney(totals.tax)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-[15px] font-extrabold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(totals.total)}</span>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex-1">
            <p className="text-[10.5px] font-semibold tracking-wide text-slate-400 uppercase">Total</p>
            <p className="text-[17px] font-extrabold text-slate-900">{formatMoney(totals.total)}</p>
          </div>
          <SubmitButton
            className="btn-primary flex-1 py-3 lg:flex-none lg:px-6"
            pendingLabel={isEdit ? "Updating…" : "Creating…"}
            disabled={customers.length === 0}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {isEdit ? "Save changes" : kind === "quotation" ? "Create quotation" : "Create invoice"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
