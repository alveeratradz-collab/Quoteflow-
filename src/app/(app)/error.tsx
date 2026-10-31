"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card card-pad mx-auto max-w-lg text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-extrabold text-slate-900">Something went wrong</h1>
      <p className="mt-1 text-sm text-slate-500">
        We couldn&apos;t load that page. Your data is safe — try again, or head back to the dashboard.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button type="button" onClick={reset} className="btn-primary">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
        <a href="/dashboard" className="btn-secondary">
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
