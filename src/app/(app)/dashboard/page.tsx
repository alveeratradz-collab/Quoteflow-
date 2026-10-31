import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CalendarPlus,
  CircleDollarSign,
  Clock3,
  FileText,
  MessageCircle,
  Plus,
  ReceiptText,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getDashboardData, getBusinessUsage } from "@/lib/queries";
import { formatDateTime, formatMoney, formatNumber, isOverdue, relativeDay } from "@/lib/money";
import { getPlan } from "@/lib/plans";
import { Alert, EmptyState, LinkButton, ProgressBar, StatusBadge } from "@/components/ui";
import { FunnelBars, RevenueChart } from "@/components/charts";

export const metadata: Metadata = { title: "Dashboard" };

const JOB_DOT: Record<string, string> = {
  pending: "bg-slate-400",
  scheduled: "bg-brand-500",
  in_progress: "bg-amber-500",
  completed: "bg-emerald-500",
  cancelled: "bg-slate-300",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; demo?: string; error?: string }>;
}) {
  const { user, business } = await requireAuth();
  const params = await searchParams;
  const [data, usage] = await Promise.all([
    getDashboardData(business.id),
    getBusinessUsage(business.id),
  ]);
  const plan = getPlan(business.plan);
  const revenueChange =
    data.lastMonthRevenue > 0
      ? Math.round(((data.monthlyRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100)
      : null;
  const greeting =
    new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {params.welcome ? (
        <div className="mb-4">
          <Alert tone="success">
            Your workspace is ready. Add a customer, create a quote, then turn it into an invoice when
            they say yes.
          </Alert>
        </div>
      ) : null}
      {params.demo ? (
        <div className="mb-4">
          <Alert tone="info">
            You&apos;re exploring the demo workspace for AquaFix Plumbing &amp; Heating — everything is
            editable and safe to click.
          </Alert>
        </div>
      ) : null}
      {params.error === "owner-only" ? (
        <div className="mb-4">
          <Alert tone="warning">Only the workspace owner can open that page.</Alert>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-brand-600 uppercase">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 text-[23px] leading-tight font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {greeting}, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s how {business.name} is doing today.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <LinkButton href="/customers?new=1" variant="secondary" className="flex-1 sm:flex-none">
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Customer
          </LinkButton>
          <LinkButton href="/quotations/new" className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4" aria-hidden="true" /> New quote
          </LinkButton>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Monthly revenue"
          value={formatMoney(data.monthlyRevenue)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          tone="brand"
          href="/invoices?status=paid"
          footnote={
            revenueChange === null ? (
              <span className="text-slate-400">No data last month</span>
            ) : (
              <span className={revenueChange >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {revenueChange >= 0 ? (
                  <ArrowUpRight className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
                )}
                {Math.abs(revenueChange)}% vs last month
              </span>
            )
          }
        />
        <StatCard
          label="Total customers"
          value={formatNumber(data.totalCustomers)}
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          href="/customers"
          footnote={`${plan.maxCustomers === Number.POSITIVE_INFINITY ? "Unlimited" : `${plan.maxCustomers} allowed`} on ${plan.name}`}
        />
        <StatCard
          label="New enquiries"
          value={formatNumber(data.newEnquiries)}
          icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
          tone="amber"
          href="/customers?status=lead"
          footnote="Leads to convert"
        />
        <StatCard
          label="Pending quotes"
          value={formatNumber(data.pendingQuotations)}
          icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
          href="/quotations?status=sent"
          footnote={formatMoney(data.pendingQuotationsValue, { compact: true })}
        />
        <StatCard
          label="Accepted quotes"
          value={formatNumber(data.acceptedQuotations)}
          icon={<FileText className="h-4 w-4" aria-hidden="true" />}
          tone="emerald"
          href="/quotations?status=accepted"
          footnote={formatMoney(data.acceptedQuotationsValue, { compact: true })}
        />
        <StatCard
          label="Unpaid invoices"
          value={formatMoney(data.outstandingPence, { compact: true })}
          icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
          tone="rose"
          href="/invoices?status=unpaid"
          footnote={`${data.unpaidInvoices} open · ${data.overdueInvoices} overdue`}
        />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card card-pad lg:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Revenue collected</h2>
              <p className="text-[12.5px] text-slate-500">Payments recorded over the last six months</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-700">
              {formatMoney(data.monthlyRevenue)} this month
            </span>
          </div>
          <RevenueChart data={data.revenueSeries} />
        </section>

        <section className="card card-pad">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Quotation pipeline</h2>
              <p className="text-[12.5px] text-slate-500">Where your quotes stand</p>
            </div>
            <Link href="/quotations" className="text-[12px] font-bold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <FunnelBars counts={data.quoteStatusCounts} />
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-[11.5px] font-semibold text-slate-500">Total invoiced value</p>
            <p className="mt-0.5 text-lg font-extrabold text-slate-900">
              {formatMoney(data.acceptedQuotationsValue + data.outstandingPence, { compact: true })}
            </p>
            <p className="mt-1 text-[11.5px] text-slate-500">
              {formatMoney(data.outstandingPence)} still to collect
            </p>
          </div>
        </section>
      </div>

      {/* Jobs + documents */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card">
          <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Today&apos;s jobs</h2>
              <p className="text-[12px] text-slate-500">{data.todaysJobs.length} scheduled today</p>
            </div>
            <Link href="/jobs" className="text-[12px] font-bold text-brand-600 hover:text-brand-700">
              Calendar
            </Link>
          </header>
          {data.todaysJobs.length === 0 ? (
            <EmptyState
              icon={<CalendarPlus className="h-5 w-5" aria-hidden="true" />}
              title="No jobs booked today"
              description="Schedule a visit so you and your crew know where to be."
              action={
                <LinkButton href="/jobs?new=1" variant="secondary">
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add job
                </LinkButton>
              }
            />
          ) : (
            <ul className="divide-row">
              {data.todaysJobs.map((job) => (
                <li key={job.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${JOB_DOT[job.status] ?? "bg-slate-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-slate-800">{job.title}</p>
                    <p className="truncate text-[12px] text-slate-500">
                      {formatDateTime(job.scheduledAt)} · {job.customerName}
                    </p>
                    {job.address ? <p className="truncate text-[11.5px] text-slate-400">{job.address}</p> : null}
                  </div>
                  <StatusBadge status={job.status} kind="job" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
            <h2 className="text-[15px] font-bold text-slate-900">Recent quotations</h2>
            <Link href="/quotations" className="text-[12px] font-bold text-brand-600 hover:text-brand-700">
              All quotes
            </Link>
          </header>
          {data.recentQuotations.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" aria-hidden="true" />}
              title="No quotations yet"
              description="Create your first professional quote — it takes about a minute."
              action={
                <LinkButton href="/quotations/new">
                  <Plus className="h-4 w-4" aria-hidden="true" /> New quote
                </LinkButton>
              }
            />
          ) : (
            <ul className="divide-row">
              {data.recentQuotations.map((quote) => (
                <li key={quote.id}>
                  <Link href={`/quotations/${quote.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/70">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-slate-800">{quote.title}</p>
                      <p className="truncate text-[12px] text-slate-500">
                        {quote.number} · {quote.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-slate-800">{formatMoney(quote.totalPence)}</p>
                      <StatusBadge status={quote.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
            <h2 className="text-[15px] font-bold text-slate-900">Recent invoices</h2>
            <Link href="/invoices" className="text-[12px] font-bold text-brand-600 hover:text-brand-700">
              All invoices
            </Link>
          </header>
          {data.recentInvoices.length === 0 ? (
            <EmptyState
              icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
              title="No invoices yet"
              description="Accept a quote and convert it into an invoice in one tap."
              action={
                <LinkButton href="/invoices/new" variant="secondary">
                  <Plus className="h-4 w-4" aria-hidden="true" /> New invoice
                </LinkButton>
              }
            />
          ) : (
            <ul className="divide-row">
              {data.recentInvoices.map((invoice) => {
                const overdue = isOverdue(
                  invoice.dueDate,
                  invoice.status,
                  invoice.amountPaidPence,
                  invoice.totalPence,
                );
                const status = overdue ? "overdue" : invoice.status;
                return (
                  <li key={invoice.id}>
                    <Link href={`/invoices/${invoice.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/70">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <ReceiptText className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-slate-800">{invoice.number}</p>
                        <p className="truncate text-[12px] text-slate-500">
                          {invoice.customerName} · due {relativeDay(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-slate-800">
                          {formatMoney(invoice.totalPence - invoice.amountPaidPence)}
                        </p>
                        <StatusBadge status={status} kind="invoice" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Onboarding / upgrade strip */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="card card-pad">
          <h2 className="mb-3 text-[15px] font-bold text-slate-900">Quick actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickAction href="/customers?new=1" icon={<UserPlus className="h-4 w-4" />} label="Add customer" />
            <QuickAction href="/quotations/new" icon={<FileText className="h-4 w-4" />} label="New quote" />
            <QuickAction href="/invoices/new" icon={<CircleDollarSign className="h-4 w-4" />} label="New invoice" />
            <QuickAction href="/jobs?new=1" icon={<CalendarClock className="h-4 w-4" />} label="Book a job" />
            <QuickAction href="/whatsapp" icon={<MessageCircle className="h-4 w-4" />} label="Follow-ups" />
            <QuickAction href="/customers" icon={<Users className="h-4 w-4" />} label="Customers" />
          </div>
        </section>

        <section className="card card-pad">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Your {plan.name} plan</h2>
              <p className="text-[12.5px] text-slate-500">{plan.tagline}</p>
            </div>
            <StatusBadge status={plan.id} kind="plan" />
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-slate-600">
                <span>Customers</span>
                <span>
                  {usage.customers} / {plan.maxCustomers === Number.POSITIVE_INFINITY ? "∞" : plan.maxCustomers}
                </span>
              </div>
              <ProgressBar value={usage.customers} max={plan.maxCustomers} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-slate-600">
                <span>Quotes this month</span>
                <span>
                  {usage.quotationsThisMonth} /{" "}
                  {plan.maxQuotationsPerMonth === Number.POSITIVE_INFINITY ? "∞" : plan.maxQuotationsPerMonth}
                </span>
              </div>
              <ProgressBar value={usage.quotationsThisMonth} max={plan.maxQuotationsPerMonth} />
            </div>
          </div>
          <Link
            href="/billing"
            className="mt-4 inline-flex w-full items-center justify-between rounded-xl bg-slate-900 px-3.5 py-2.5 text-[13px] font-bold text-white hover:bg-slate-800"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {plan.id === "free" ? "Unlock more with a paid plan" : "Manage plan & billing"}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  footnote,
  tone = "slate",
  href,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  footnote?: ReactNode;
  tone?: "slate" | "brand" | "emerald" | "amber" | "rose";
  href: string;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <Link href={href} className="card card-pad group flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] leading-tight font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2.5 text-[21px] leading-none font-extrabold tracking-tight text-slate-900">{value}</p>
      {footnote ? <p className="mt-1.5 text-[11px] leading-tight text-slate-400">{footnote}</p> : null}
    </Link>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-[12.5px] font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700"
    >
      <span className="text-brand-600">{icon}</span>
      {label}
    </Link>
  );
}
