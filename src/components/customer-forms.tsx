"use client";

import { useActionState } from "react";
import { Plus, Save } from "lucide-react";
import {
  addCustomerNoteAction,
  createCustomerAction,
  updateCustomerAction,
} from "@/app/actions/customers";
import type { Customer } from "@/db/schema";
import type { FormState } from "@/lib/validation";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const initial: FormState = {};

export function CustomerForm({
  customer,
  onDone,
  submitLabel,
}: {
  customer?: Customer;
  onDone?: string;
  submitLabel?: string;
}) {
  const action = customer ? updateCustomerAction : createCustomerAction;
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3.5" noValidate>
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <div>
        <label className="label" htmlFor="customer-name">
          Customer name <span className="text-rose-500">*</span>
        </label>
        <input
          id="customer-name"
          name="name"
          required
          defaultValue={customer?.name ?? ""}
          className={`input ${state.fieldErrors?.name ? "input-error" : ""}`}
          placeholder="Sarah Whitfield"
          autoComplete="name"
        />
        {state.fieldErrors?.name ? <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.name}</p> : null}
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="customer-phone">
            Phone <span className="text-rose-500">*</span>
          </label>
          <input
            id="customer-phone"
            name="phone"
            type="tel"
            required
            defaultValue={customer?.phone ?? ""}
            className={`input ${state.fieldErrors?.phone ? "input-error" : ""}`}
            placeholder="07700 900123"
            autoComplete="tel"
          />
          {state.fieldErrors?.phone ? <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.phone}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="customer-email">
            Email
          </label>
          <input
            id="customer-email"
            name="email"
            type="email"
            defaultValue={customer?.email ?? ""}
            className={`input ${state.fieldErrors?.email ? "input-error" : ""}`}
            placeholder="sarah@example.com"
            autoComplete="email"
          />
          {state.fieldErrors?.email ? <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.email}</p> : null}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="customer-address">
          Address
        </label>
        <textarea
          id="customer-address"
          name="address"
          rows={2}
          defaultValue={customer?.address ?? ""}
          className="input"
          placeholder="14 Maple Grove, Leeds LS7 2QT"
        />
      </div>

      <div>
        <label className="label" htmlFor="customer-status">
          Status
        </label>
        <select id="customer-status" name="status" defaultValue={customer?.status ?? "active"} className="input">
          <option value="active">Active customer</option>
          <option value="lead">New enquiry</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="customer-notes">
          Notes
        </label>
        <textarea
          id="customer-notes"
          name="notes"
          rows={3}
          defaultValue={customer?.notes ?? ""}
          className="input"
          placeholder="Gate code, preferred contact times, boiler make & model…"
        />
      </div>

      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Saving…">
        {customer ? <Save className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        {submitLabel ?? (customer ? "Save changes" : "Add customer")}
      </SubmitButton>
      {onDone ? <input type="hidden" name="returnTo" value={onDone} /> : null}
    </form>
  );
}

export function NoteForm({ customerId }: { customerId: string }) {
  const [state, formAction] = useActionState(addCustomerNoteAction, initial);
  return (
    <form action={formAction} className="space-y-2.5">
      <input type="hidden" name="customerId" value={customerId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}
      <textarea
        name="body"
        rows={2}
        required
        className="input"
        placeholder="Add a note — e.g. quoted for bathroom refit, follow up Friday"
      />
      <SubmitButton className="btn-secondary w-full" pendingLabel="Saving note…">
        <Plus className="h-4 w-4" aria-hidden="true" /> Save note
      </SubmitButton>
    </form>
  );
}
