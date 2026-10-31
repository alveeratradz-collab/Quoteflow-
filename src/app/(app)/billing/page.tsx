import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Info,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getBusinessUsage, listStaff } from "@/lib/queries";
import { getPlan, PLANS, PLAN_ORDER, planLimitLabel } from "@/lib/plans";
import { formatDate } from "@/lib/money";
import { Alert, PageHeader, ProgressBar, StatusBadge } from "@/components/ui";
import { PlanForm } from "@/components/billing-forms";
import { cancelPlanAction } from "@/app/actions/billing";
import { ConfirmSubmit } from "@/components/interactive";

export const metadata: Metadata = { title: "Plan & billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string; checkout?: string; plan?: string }>;
}) {
  const { user, business } = await requireAuth();
  const params = await searchParams;
  const [usage, staff] = await Promise.all([getBusinessUsage(business.id), listStaff(business.id)]);
  const plan = getPlan(business.plan);
  const isOwner = user.role === "owner";
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <div>
      <PageHeader
        eyebrow="Subscription"
        title="Plan & billing"
        description="Upgrade when you're busy, downgrade when you're quiet. No lock-in."
      />

      {params.cancelled ? (
        <div className="mb-4"><Alert tone="info">Your subscription is cancelled and the account is on the Free plan.</Alert></div>
      ) : null}
      {params.checkout === "success" ? (
        <div className="mb-4"><Alert tone="success">Payment received — your plan will update as soon as Stripe confirms the subscription.</Alert></div>
      ) : null}
      {params.checkout === "cancelled" ? (
        <div className="mb-4"><Alert tone="warning">Checkout cancelled — no payment was taken.</Alert></div>
      ) : null}
      {!isOwner ? (
        <div className="mb-4">
          <Alert tone="info">Only the workspace owner can change the plan or manage billing.</Alert>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10.5px] font-bold tracking-wide text-slate-400 uppercase">Current plan</p>
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{plan.name}</h2>
                  <StatusBadge status={plan.id} kind="plan" />
                </div>
                <p className="mt-1 text-[12.5px] text-slate-500">{plan.tagline}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-slate-900">
                  {plan.priceLabel}
                  <span className="text-[12px] font-medium text-slate-500">/mo</span>
                </p>
                {business.currentPeriodEnd ? (
                  <p className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <CalendarClock className="h-3 w-3" aria-hidden="true" /> Renews {formatDate(business.currentPeriodEnd)}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">No renewal date</p>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <UsageTile
                icon={<Users className="h-4 w-4" aria-hidden="true" />}
                label="Customers"
                used={usage.customers}
                limit={plan.maxCustomers}
              />
              <UsageTile
                icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
                label="Quotes this month"
                used={usage.quotationsThisMonth}
                limit={plan.maxQuotationsPerMonth}
              />
              <UsageTile
                icon={<BadgeCheck className="h-4 w-4" aria-hidden="true" />}
                label="Team members"
                used={usage.staff}
                limit={plan.maxStaff + 1}
              />
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            {PLAN_ORDER.map((planId) => {
              const definition = PLANS[planId];
              const current = business.plan === planId;
              return (
                <section
                  key={planId}
                  className={`card card-pad flex flex-col ${current ? "ring-2 ring-brand-600" : ""} ${
                    definition.highlight && !current ? "border-brand-200" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-[15px] font-extrabold text-slate-900">{definition.name}</h3>
                        {definition.highlight ? (
                          <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                            Popular
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11.5px] text-slate-500">{definition.tagline}</p>
                    </div>
                    <p className="text-right text-lg font-extrabold text-slate-900">
                      {definition.priceLabel}
                      <span className="block text-[10px] font-medium text-slate-400">per month</span>
                    </p>
                  </div>
                  <ul className="mt-2.5 flex-1 space-y-1.5">
                    {definition.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5 text-[12px] text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isOwner ? (
                    <PlanForm
                      planId={planId}
                      currentPlan={business.plan}
                      label={
                        planId === "free"
                          ? "Switch to Free"
                          : PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(business.plan)
                            ? `Upgrade to ${definition.name}`
                            : `Switch to ${definition.name}`
                      }
                    />
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="card card-pad">
            <h2 className="flex items-center gap-1.5 text-[14px] font-bold text-slate-900">
              <CreditCard className="h-4 w-4 text-brand-600" aria-hidden="true" /> Payment collection
            </h2>
            <div className={`mt-2 rounded-xl border px-3 py-2.5 text-[12px] font-medium ${stripeReady ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {stripeReady
                ? "Stripe is connected. Upgrades open a secure Stripe Checkout subscription."
                : "Stripe isn't connected yet. Plans activate in demo mode so you can test every feature, and no card is charged."}
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Add <code className="rounded bg-slate-100 px-1">STRIPE_SECRET_KEY</code> (and your webhook secret)
              to the environment to switch on live monthly billing. The checkout and metadata plumbing is
              already wired to the business record.
            </p>
            {!stripeReady && isOwner && business.plan !== "free" ? (
              <form action={cancelPlanAction} className="mt-3">
                <ConfirmSubmit message="Cancel your plan and move to Free?" className="btn-secondary w-full text-[12px]">
                  Cancel subscription
                </ConfirmSubmit>
              </form>
            ) : null}
          </section>

          <section className="card card-pad">
            <h2 className="text-[14px] font-bold text-slate-900">Plan limits</h2>
            <ul className="mt-2 space-y-2 text-[12px] text-slate-600">
              <li className="flex justify-between gap-2">
                <span>Customers</span>
                <span className="font-semibold">{planLimitLabel(plan.maxCustomers)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Quotes / month</span>
                <span className="font-semibold">{planLimitLabel(plan.maxQuotationsPerMonth)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Team members</span>
                <span className="font-semibold">{plan.maxStaff === 0 ? "Owner only" : plan.maxStaff}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Invoices</span>
                <span className="font-semibold">Unlimited</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>PDF documents</span>
                <span className="font-semibold">Included</span>
              </li>
            </ul>
          </section>

          <section className="card card-pad">
            <h2 className="flex items-center gap-1.5 text-[14px] font-bold text-slate-900">
              <Users className="h-4 w-4 text-slate-400" aria-hidden="true" /> Team
            </h2>
            <p className="mt-1 text-[12px] text-slate-500">
              {staff.length} {staff.length === 1 ? "person" : "people"} can access this workspace.
            </p>
            <Link href="/settings#team" className="btn-secondary mt-2 w-full text-[12px]">
              Manage team members
            </Link>
          </section>

          <section className="card card-pad">
            <h2 className="flex items-center gap-1.5 text-[14px] font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Your data
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              Each business is isolated at the database level — customers, quotes, invoices and payments are
              only ever queried for your own workspace. Staff you invite share your data; nobody else can
              see it.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function UsageTile({
  icon,
  label,
  used,
  limit,
}: {
  icon: ReactNode;
  label: string;
  used: number;
  limit: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <p className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide text-slate-400 uppercase">
        {icon} {label}
      </p>
      <p className="mt-1 text-[15px] font-extrabold text-slate-900">
        {used}
        <span className="text-[11.5px] font-medium text-slate-400">
          {" "}
          / {Number.isFinite(limit) ? limit : "∞"}
        </span>
      </p>
      <div className="mt-1.5">
        <ProgressBar value={used} max={limit} />
      </div>
    </div>
  );
}
