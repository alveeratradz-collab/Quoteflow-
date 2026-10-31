import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <span className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        The page or document you&apos;re looking for doesn&apos;t exist, or the link has expired.
      </p>
      <div className="mt-5 flex gap-2">
        <Link href="/" className="btn-secondary">
          Back to home
        </Link>
        <Link href="/dashboard" className="btn-primary">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
