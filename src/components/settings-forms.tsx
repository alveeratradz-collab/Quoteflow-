"use client";

import { useActionState } from "react";
import { Save, ShieldCheck, UserPlus } from "lucide-react";
import {
  addStaffAction,
  changePasswordAction,
  updateBusinessAction,
  updateProfileAction,
} from "@/app/actions/business";
import type { Business, User } from "@/db/schema";
import type { FormState } from "@/lib/validation";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const initial: FormState = {};

export function BusinessForm({ business }: { business: Business }) {
  const [state, formAction] = useActionState(updateBusinessAction, initial);
  return (
    <form action={formAction} className="space-y-3.5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="biz-name">Business name</label>
          <input id="biz-name" name="name" required defaultValue={business.name} className="input" />
          {state.fieldErrors?.name ? <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.name}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="biz-owner">Owner name</label>
          <input id="biz-owner" name="ownerName" defaultValue={business.ownerName} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="biz-email">Business email</label>
          <input id="biz-email" name="email" type="email" defaultValue={business.email} className="input" />
          {state.fieldErrors?.email ? <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.email}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="biz-phone">Phone</label>
          <input id="biz-phone" name="phone" defaultValue={business.phone} className="input" placeholder="0113 496 0180" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="biz-address">Address</label>
          <input id="biz-address" name="address" defaultValue={business.address} className="input" placeholder="Unit 4, Kirkstall Business Park" />
        </div>
        <div>
          <label className="label" htmlFor="biz-city">Town / city</label>
          <input id="biz-city" name="city" defaultValue={business.city} className="input" placeholder="Leeds" />
        </div>
        <div>
          <label className="label" htmlFor="biz-postcode">Postcode</label>
          <input id="biz-postcode" name="postcode" defaultValue={business.postcode} className="input" placeholder="LS5 3BX" />
        </div>
        <div>
          <label className="label" htmlFor="biz-vat">VAT number</label>
          <input id="biz-vat" name="vatNumber" defaultValue={business.vatNumber} className="input" placeholder="GB 123 456 789" />
          <p className="mt-1 text-[11px] text-slate-400">Not VAT registered? Leave blank.</p>
        </div>
        <div>
          <label className="label" htmlFor="biz-tax">Default VAT / tax rate (%)</label>
          <input id="biz-tax" name="taxRate" type="number" min={0} max={100} defaultValue={business.taxRate} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="biz-website">Website</label>
          <input id="biz-website" name="website" defaultValue={business.website} className="input" placeholder="aquafixplumbing.co.uk" />
        </div>
      </div>

      <SubmitButton className="btn-primary w-full sm:w-auto" pendingLabel="Saving…">
        <Save className="h-4 w-4" aria-hidden="true" /> Save business profile
      </SubmitButton>
    </form>
  );
}

export function ProfileForm({ user }: { user: User }) {
  const [state, formAction] = useActionState(updateProfileAction, initial);
  return (
    <form action={formAction} className="space-y-3.5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="profile-name">Your name</label>
          <input id="profile-name" name="name" required defaultValue={user.name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="profile-email">Login email</label>
          <input id="profile-email" name="email" type="email" required defaultValue={user.email} className="input" />
          {state.fieldErrors?.email ? <p className="mt-1 text-[12px] font-medium text-rose-600">{state.fieldErrors.email}</p> : null}
        </div>
      </div>
      <SubmitButton className="btn-secondary" pendingLabel="Saving…">
        <Save className="h-4 w-4" aria-hidden="true" /> Save my details
      </SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initial);
  return (
    <form action={formAction} className="space-y-3.5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="current-password">Current password</label>
          <input id="current-password" name="currentPassword" type="password" required className="input" autoComplete="current-password" />
        </div>
        <div>
          <label className="label" htmlFor="new-password">New password</label>
          <input id="new-password" name="newPassword" type="password" required minLength={8} className="input" autoComplete="new-password" />
        </div>
      </div>
      <SubmitButton className="btn-secondary" pendingLabel="Updating…">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Change password
      </SubmitButton>
    </form>
  );
}

export function StaffForm() {
  const [state, formAction] = useActionState(addStaffAction, initial);
  return (
    <form action={formAction} className="space-y-3.5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}
      <div className="grid gap-3.5 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="staff-name">Name</label>
          <input id="staff-name" name="name" required className="input" placeholder="Sam Reed" />
        </div>
        <div>
          <label className="label" htmlFor="staff-email">Email</label>
          <input id="staff-email" name="email" type="email" required className="input" placeholder="sam@business.co.uk" />
        </div>
        <div>
          <label className="label" htmlFor="staff-password">Temporary password</label>
          <input id="staff-password" name="password" type="text" required minLength={8} className="input" placeholder="At least 8 characters" />
        </div>
      </div>
      <SubmitButton className="btn-primary" pendingLabel="Adding…">
        <UserPlus className="h-4 w-4" aria-hidden="true" /> Add team member
      </SubmitButton>
      <p className="text-[11.5px] text-slate-400">
        Team members share your customers and documents but cannot manage billing.
      </p>
    </form>
  );
}
