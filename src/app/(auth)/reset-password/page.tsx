import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth-forms";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Pick something memorable and at least 8 characters long.
      </p>
      <div className="mt-5">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="space-y-4">
            <Alert tone="error">
              This reset link is missing its security token. Request a new one from the sign-in page.
            </Alert>
            <Link href="/forgot-password" className="btn-primary w-full">
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
