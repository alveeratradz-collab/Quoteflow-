import type { Metadata } from "next";
import { DemoLoginButton, LoginForm } from "@/components/auth-forms";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ loggedOut?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Sign in to manage your customers, quotes and jobs.
      </p>
      <div className="mt-5 space-y-3">
        {params.loggedOut ? <Alert tone="success">You&apos;ve been signed out safely.</Alert> : null}
        {params.error === "demo" ? (
          <Alert tone="error">The demo workspace couldn&apos;t be prepared. Please try again.</Alert>
        ) : null}
      </div>
      <div className="mt-4">
        <LoginForm />
      </div>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <DemoLoginButton />
      <p className="mt-3 text-center text-[11.5px] text-slate-400">
        Demo credentials: demo@quoteflow.app · quoteflow123
      </p>
    </div>
  );
}
