"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, Sparkles } from "lucide-react";
import {
  demoLoginAction,
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/app/actions/auth";
import type { FormState } from "@/lib/validation";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const initial: FormState = {};

function FieldErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[12px] font-medium text-rose-600">{message}</p>;
}

export function LoginForm({ nextUrl }: { nextUrl?: string }) {
  const [state, formAction] = useActionState(loginAction, initial);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {nextUrl ? <input type="hidden" name="next" value={nextUrl} /> : null}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <div>
        <label className="label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@yourbusiness.co.uk"
          className="input"
        />
        <FieldErrorText message={state.fieldErrors?.email} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="password">
            Password
          </label>
          <Link href="/forgot-password" className="mb-1.5 text-[12px] font-semibold text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="input"
        />
        <FieldErrorText message={state.fieldErrors?.password} />
      </div>
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Signing in…">
        Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </SubmitButton>
      <p className="text-center text-sm text-slate-500">
        New to QuoteFlow?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function DemoLoginButton() {
  return (
    <form action={demoLoginAction}>
      <SubmitButton className="btn-secondary w-full py-3" pendingLabel="Preparing demo…">
        <Sparkles className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Explore the live demo workspace
      </SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initial);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input id="name" name="name" required className="input" placeholder="Dave Carter" autoComplete="name" />
          <FieldErrorText message={state.fieldErrors?.name} />
        </div>
        <div>
          <label className="label" htmlFor="businessName">
            Business name
          </label>
          <input
            id="businessName"
            name="businessName"
            required
            className="input"
            placeholder="AquaFix Plumbing"
            autoComplete="organization"
          />
          <FieldErrorText message={state.fieldErrors?.businessName} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input"
          placeholder="you@yourbusiness.co.uk"
          autoComplete="email"
        />
        <FieldErrorText message={state.fieldErrors?.email} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="input"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <FieldErrorText message={state.fieldErrors?.password} />
        </div>
        <div>
          <label className="label" htmlFor="taxRate">
            VAT / tax rate (%)
          </label>
          <input
            id="taxRate"
            name="taxRate"
            type="number"
            min={0}
            max={100}
            defaultValue={20}
            className="input"
          />
          <FieldErrorText message={state.fieldErrors?.taxRate} />
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-[13px] text-slate-600">
        <input type="checkbox" name="seedSamples" defaultChecked className="mt-0.5 h-4 w-4 accent-brand-600" />
        <span>
          <strong className="font-semibold text-slate-800">Add sample customers & documents</strong>
          <br />
          Great for exploring. You can delete them at any time.
        </span>
      </label>
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Creating your workspace…">
        Create my workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </SubmitButton>
      <p className="text-center text-[12px] text-slate-500">
        By creating an account you agree to our terms and privacy policy. 14-day professional features
        included on every new account.
      </p>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initial);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}
      {state.resetLink ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3.5">
          <p className="text-[12px] font-semibold text-brand-800">Email delivery isn&apos;t configured here</p>
          <p className="mt-1 text-[12px] text-brand-700">
            Use your secure, single-use reset link:
          </p>
          <Link
            href={state.resetLink}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12px] font-bold text-brand-700 shadow-sm hover:bg-brand-50"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Open reset link
          </Link>
        </div>
      ) : null}
      <div>
        <label className="label" htmlFor="reset-email">
          Email address
        </label>
        <input id="reset-email" name="email" type="email" required className="input" placeholder="you@business.co.uk" />
      </div>
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Creating link…">
        Send reset instructions
      </SubmitButton>
      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initial);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}
      <div>
        <label className="label" htmlFor="new-password">
          New password
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          required
          minLength={8}
          className="input"
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm-password">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="input"
          autoComplete="new-password"
        />
      </div>
      <SubmitButton className="btn-primary w-full py-3" pendingLabel="Updating…">
        Update password
      </SubmitButton>
      {state.ok ? (
        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Continue to sign in
          </Link>
        </p>
      ) : null}
    </form>
  );
}
