"use client";

import { useActionState, useRef } from "react";
import { CalendarPlus } from "lucide-react";
import { createJobAction, updateJobAction, updateJobStatusAction } from "@/app/actions/jobs";
import type { FormState } from "@/lib/validation";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const initial: FormState = {};

export type JobInitial = {
  id?: string;
  customerId?: string;
  title?: string;
  description?: string;
  status?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  address?: string;
  assignedTo?: string;
};

export function JobForm({
  customers,
  initialValues,
  defaultCustomerId,
}: {
  customers: { id: string; name: string; address: string }[];
  initialValues?: JobInitial;
  defaultCustomerId?: string;
}) {
  const action = initialValues?.id ? updateJobAction : createJobAction;
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3.5" noValidate>
      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <div>
        <label className="label" htmlFor="job-customer">
          Customer <span className="text-rose-500">*</span>
        </label>
        <select
          id="job-customer"
          name="customerId"
          defaultValue={initialValues?.customerId ?? defaultCustomerId ?? customers[0]?.id ?? ""}
          className="input"
          required
        >
          <option value="">Choose a customer…</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.customerId ? (
          <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.customerId}</p>
        ) : null}
      </div>

      <div>
        <label className="label" htmlFor="job-title">
          Job title <span className="text-rose-500">*</span>
        </label>
        <input
          id="job-title"
          name="title"
          required
          defaultValue={initialValues?.title ?? ""}
          className="input"
          placeholder="Boiler service & radiator check"
        />
        {state.fieldErrors?.title ? (
          <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="job-when">
            Appointment
          </label>
          <input
            id="job-when"
            name="scheduledAt"
            type="datetime-local"
            defaultValue={initialValues?.scheduledAt ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="job-duration">
            Duration (minutes)
          </label>
          <input
            id="job-duration"
            name="durationMinutes"
            type="number"
            min={15}
            step={15}
            defaultValue={initialValues?.durationMinutes ?? 60}
            className="input"
          />
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="job-status">
            Status
          </label>
          <select id="job-status" name="status" defaultValue={initialValues?.status ?? "scheduled"} className="input">
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="job-assignee">
            Assigned to
          </label>
          <input
            id="job-assignee"
            name="assignedTo"
            defaultValue={initialValues?.assignedTo ?? ""}
            className="input"
            placeholder="Dave"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="job-address">
          Address
        </label>
        <input
          id="job-address"
          name="address"
          defaultValue={initialValues?.address ?? ""}
          className="input"
          placeholder="Leave blank to use the customer's address"
        />
      </div>

      <div>
        <label className="label" htmlFor="job-description">
          Description
        </label>
        <textarea
          id="job-description"
          name="description"
          rows={3}
          defaultValue={initialValues?.description ?? ""}
          className="input"
          placeholder="What needs doing, access details, parts to bring…"
        />
      </div>

      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Saving…">
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        {initialValues?.id ? "Save job" : "Add to schedule"}
      </SubmitButton>
    </form>
  );
}

export function JobStatusSelect({ jobId, status }: { jobId: string; status: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={updateJobStatusAction} ref={formRef}>
      <input type="hidden" name="id" value={jobId} />
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11.5px] font-semibold text-slate-700 focus:border-brand-500 focus:outline-none"
        aria-label="Update job status"
      >
        <option value="pending">Pending</option>
        <option value="scheduled">Scheduled</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </form>
  );
}
