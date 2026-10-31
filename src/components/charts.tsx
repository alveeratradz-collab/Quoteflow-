import { formatMoney } from "@/lib/money";

export function RevenueChart({ data }: { data: { label: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div>
      <div className="flex h-40 items-end gap-2 sm:gap-3">
        {data.map((point, index) => {
          const height = Math.max(4, Math.round((point.total / max) * 100));
          const isLast = index === data.length - 1;
          return (
            <div key={`${point.label}-${index}`} className="group flex flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10.5px] font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                {formatMoney(point.total, { compact: true })}
              </span>
              <div
                className={`w-full rounded-t-lg transition-all ${
                  isLast ? "bg-gradient-to-t from-brand-700 to-brand-500" : "bg-brand-100 group-hover:bg-brand-200"
                }`}
                style={{ height: `${height}%` }}
                title={`${point.label}: ${formatMoney(point.total)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {data.map((point, index) => (
          <span
            key={`${point.label}-label-${index}`}
            className="flex-1 text-center text-[10.5px] font-semibold text-slate-400"
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FunnelBars({
  counts,
}: {
  counts: { status: string; count: number; total: number }[];
}) {
  const order = ["draft", "sent", "accepted", "rejected"];
  const labels: Record<string, string> = {
    draft: "Draft",
    sent: "Awaiting reply",
    accepted: "Accepted",
    rejected: "Rejected",
  };
  const colors: Record<string, string> = {
    draft: "bg-slate-300",
    sent: "bg-brand-500",
    accepted: "bg-emerald-500",
    rejected: "bg-rose-400",
  };
  const rows = order.map((status) => {
    const found = counts.find((c) => c.status === status);
    return { status, count: found?.count ?? 0, total: found?.total ?? 0 };
  });
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
        return (
          <div key={row.status}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-slate-600">{labels[row.status]}</span>
              <span className="text-slate-500">
                {row.count} · {formatMoney(row.total, { compact: true })}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${colors[row.status]}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      {total === 0 ? <p className="text-[13px] text-slate-500">No quotations yet — create your first one.</p> : null}
    </div>
  );
}
