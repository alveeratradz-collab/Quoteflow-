export const CURRENCY = "GBP";

export function formatMoney(pence: number, options?: { compact?: boolean }): string {
  const value = (pence || 0) / 100;
  if (options?.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: CURRENCY,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

/** Parse a user-entered money string (e.g. "125.50", "£1,200") into pence. */
export function parseMoneyToPence(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  const cleaned = String(input).replace(/[^0-9.-]/g, "");
  if (!cleaned) return 0;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function penceToInput(pence: number): string {
  return (pence / 100).toFixed(2);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(`${value.slice(0, 10)}T12:00:00`) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number, from = new Date()): string {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function isOverdue(dueDate: string, status: string, amountPaid: number, total: number): boolean {
  if (status === "paid") return false;
  if (amountPaid >= total && total > 0) return false;
  return dueDate.slice(0, 10) < todayISO();
}

export function daysBetween(dateISO: string, now = new Date()): number {
  const target = new Date(`${dateISO.slice(0, 10)}T12:00:00`);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

export function relativeDay(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() -
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()) /
      86_400_000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(date);
}
