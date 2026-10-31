import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Reset your password</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Enter the email you signed up with and we&apos;ll create a secure, single-use reset link that
        expires in 60 minutes.
      </p>
      <div className="mt-5">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
