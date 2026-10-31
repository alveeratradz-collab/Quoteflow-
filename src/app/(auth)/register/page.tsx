import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const planName = params.plan ? params.plan.charAt(0).toUpperCase() + params.plan.slice(1) : null;
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Create your workspace</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Set up your business in under two minutes. Free plan, no card required.
      </p>
      {planName ? (
        <p className="mt-3 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-[13px] font-medium text-brand-800">
          You selected the <strong>{planName}</strong> plan — you can activate it from Plan &amp; billing
          after creating your account.
        </p>
      ) : null}
      <div className="mt-5">
        <RegisterForm />
      </div>
    </div>
  );
}
