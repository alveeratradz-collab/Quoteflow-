import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, LogOut, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand";
import { BottomNav, MobileTopBar, SidebarNav } from "@/components/shell-nav";
import { SubmitButton } from "@/components/submit-button";
import { logoutAction } from "@/app/actions/auth";
import { getAuth } from "@/lib/auth";
import { getBusinessUsage } from "@/lib/queries";
import { getPlan } from "@/lib/plans";
import { ProgressBar } from "@/components/ui";

export async function AppShell({ children }: { children: ReactNode }) {
  const auth = await getAuth();
  if (!auth) return null;
  const { user, business } = auth;
  const plan = getPlan(business.plan);
  const usage = await getBusinessUsage(business.id);
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <Logo href="/dashboard" subtitle="Business & Customer Manager" />
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="truncate text-[13px] font-bold text-slate-800">{business.name}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="badge bg-white text-brand-700 ring-1 ring-brand-100">{plan.name} plan</span>
          </div>
        </div>
        <div className="mt-5 flex-1 overflow-y-auto">
          <p className="mb-2 px-3 text-[10.5px] font-bold tracking-[0.14em] text-slate-400 uppercase">
            Workspace
          </p>
          <SidebarNav />
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Customers</span>
            <span>
              {usage.customers}/{Number.isFinite(plan.maxCustomers) ? plan.maxCustomers : "∞"}
            </span>
          </div>
          <div className="mt-1.5">
            <ProgressBar value={usage.customers} max={plan.maxCustomers} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Quotes this month</span>
            <span>
              {usage.quotationsThisMonth}/{Number.isFinite(plan.maxQuotationsPerMonth) ? plan.maxQuotationsPerMonth : "∞"}
            </span>
          </div>
          <div className="mt-1.5">
            <ProgressBar value={usage.quotationsThisMonth} max={plan.maxQuotationsPerMonth} />
          </div>
          <Link
            href="/billing"
            className="mt-3 flex items-center justify-between rounded-lg bg-brand-600 px-2.5 py-2 text-[12px] font-bold text-white hover:bg-brand-700"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Upgrade
            </span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-2.5 border-t border-slate-100 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-[12px] font-bold text-brand-700">
            {initials || "QF"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-slate-800">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">
              {user.role === "owner" ? "Owner" : "Team member"}
            </p>
          </div>
          <form action={logoutAction}>
            <SubmitButton className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" pendingLabel="">
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </SubmitButton>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar businessName={business.name} planLabel={plan.name} userName={user.name} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-24 sm:px-6 sm:pt-6 lg:pb-10">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
