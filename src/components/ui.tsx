import type { ReactNode } from "react";
import Link from "next/link";

/* ---------------------------------- Badges --------------------------------- */

const QUOTE_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-brand-50 text-brand-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
};

const INVOICE_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  unpaid: "bg-amber-50 text-amber-700",
  overdue: "bg-rose-50 text-rose-700",
  part_paid: "bg-sky-50 text-sky-700",
};

const JOB_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  scheduled: "bg-brand-50 text-brand-700",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const PLAN_STYLES: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  starter: "bg-sky-50 text-sky-700",
  professional: "bg-brand-50 text-brand-700",
  business: "bg-violet-50 text-violet-700",
};

const LABELS: Record<string, string> = {
  in_progress: "In progress",
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  paid: "Paid",
  part_paid: "Part paid",
  unpaid: "Unpaid",
  overdue: "Overdue",
  pending: "Pending",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  lead: "Enquiry",
  active: "Active",
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  business: "Business",
};

export function StatusBadge({
  status,
  kind = "quote",
}: {
  status: string;
  kind?: "quote" | "invoice" | "job" | "plan" | "customer";
}) {
  const styles =
    kind === "invoice"
      ? INVOICE_STYLES
      : kind === "job"
        ? JOB_STYLES
        : kind === "plan"
          ? PLAN_STYLES
          : kind === "customer"
            ? { lead: "bg-amber-50 text-amber-700", active: "bg-emerald-50 text-emerald-700" }
            : QUOTE_STYLES;
  const className = styles[status] ?? "bg-slate-100 text-slate-600";
  return <span className={`badge ${className}`}>{LABELS[status] ?? status}</span>;
}

/* ---------------------------------- Alerts --------------------------------- */

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info" | "warning";
  children: ReactNode;
}) {
  if (!children) return null;
  const styles = {
    error: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-brand-200 bg-brand-50 text-brand-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-3.5 py-2.5 text-[13px] font-medium ${styles}`}>
      {children}
    </div>
  );
}

/* --------------------------------- Sections -------------------------------- */

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-brand-600 uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <p className="text-[15px] font-bold text-slate-800">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-right text-[13px] font-semibold text-slate-800">{value}</span>
    </div>
  );
}

export function ProgressBar({ value, max, tone = "brand" }: { value: number; max: number; tone?: "brand" | "amber" | "rose" }) {
  const pct = max > 0 && Number.isFinite(max) ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = tone === "rose" ? "bg-rose-500" : tone === "amber" ? "bg-amber-500" : "bg-brand-600";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const styles = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
  }[variant];
  return (
    <Link href={href} className={`${styles} ${className}`}>
      {children}
    </Link>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[12px] font-medium text-rose-600">{message}</p>;
}
