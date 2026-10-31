"use client";

import { useActionState, useState } from "react";
import { Banknote } from "lucide-react";
import { recordPaymentAction } from "@/app/actions/invoices";
import { formatMoney } from "@/lib/money";
import type { FormState } from "@/lib/validation";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const initial: FormState = {};

export function PaymentForm({ invoiceId, outstandingPence }: { invoiceId: string; outstandingPence: number }) {
  const [state, formAction] = useActionState(recordPaymentAction, initial);
  const [payFull, setPayFull] = useState(true);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
        <span className="text-[12.5px] font-semibold text-slate-700">
          Pay full balance ({formatMoney(outstandingPence)})
        </span>
        <input
          type="checkbox"
          name="payFull"
          checked={payFull}
          onChange={(event) => setPayFull(event.target.checked)}
          className="h-4 w-4 accent-brand-600"
        />
      </label>

      {!payFull ? (
        <div>
          <label className="label" htmlFor="payment-amount">
            Amount received (£)
          </label>
          <input
            id="payment-amount"
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            className="input"
            required
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="payment-method">
            Method
          </label>
          <select id="payment-method" name="method" className="input">
            <option value="bank_transfer">Bank transfer</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="payment-reference">
            Reference
          </label>
          <input id="payment-reference" name="reference" className="input" placeholder="Optional" />
        </div>
      </div>

      <SubmitButton className="btn-primary w-full" pendingLabel="Recording…">
        <Banknote className="h-4 w-4" aria-hidden="true" /> Record payment
      </SubmitButton>
    </form>
  );
}
