import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Lock, ShieldCheck, Sparkles, UserRound, Users } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getBusinessUsage, listStaff } from "@/lib/queries";
import { getPlan } from "@/lib/plans";
import { formatDate } from "@/lib/money";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
import {
  BusinessForm,
  PasswordForm,
  ProfileForm,
  StaffForm,
} from "@/components/settings-forms";
import { removeStaffAction, setStaffActiveAction } from "@/app/actions/business";
import { ConfirmSubmit } from "@/components/interactive";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, business } = await requireAuth();
  const [staff, usage] = await Promise.all([listStaff(business.id), getBusinessUsage(business.id)]);
  const plan = getPlan(business.plan);
  const isOwner = user.role === "owner";

  return (
    <div>
      <PageHeader
        eyebrow="Your workspace"
        title="Settings"
        description="Business details that appear on your documents, your account and your team."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <section className="card card-pad">
            <header className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Business profile</h2>
                <p className="text-[12px] text-slate-500">Shown on your quotations, invoices and PDFs.</p>
              </div>
            </header>
            <BusinessForm business={business} />
          </section>

          <section id="team" className="card card-pad">
            <header className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Team members</h2>
                  <p className="text-[12px] text-slate-500">
                    {staff.length} with access · {plan.name} plan allows{" "}
                    {plan.maxStaff === 0 ? "owner only" : `${plan.maxStaff} team member(s)`}
                  </p>
                </div>
              </div>
              <StatusBadge status={plan.id} kind="plan" />
            </header>

            <ul className="divide-row mb-4 overflow-hidden rounded-xl border border-slate-200">
              {staff.map((member) => (
                <li key={member.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                    {member.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-800">
                      {member.name}
                      {member.id === user.id ? <span className="ml-1.5 text-[10.5px] text-slate-400">(you)</span> : null}
                    </p>
                    <p className="truncate text-[11.5px] text-slate-500">{member.email}</p>
                  </div>
                  <span className="badge bg-slate-100 text-slate-600">{member.role === "owner" ? "Owner" : "Staff"}</span>
                  {!member.isActive ? <span className="badge bg-amber-50 text-amber-700">Paused</span> : null}
                  {isOwner && member.id !== user.id ? (
                    <div className="flex items-center gap-1.5">
                      <form action={setStaffActiveAction}>
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="isActive" value={member.isActive ? "false" : "true"} />
                        <button type="submit" className="btn-ghost px-2 py-1 text-[11px]">
                          {member.isActive ? "Pause" : "Restore"}
                        </button>
                      </form>
                      <form action={removeStaffAction}>
                        <input type="hidden" name="id" value={member.id} />
                        <ConfirmSubmit message={`Remove ${member.name} from the workspace?`} className="btn-ghost px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50">
                          Remove
                        </ConfirmSubmit>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>

            {isOwner ? (
              usage.staff >= plan.maxStaff ? (
                <Alert tone="warning">
                  Your {plan.name} plan includes {plan.maxStaff} team {plan.maxStaff === 1 ? "member" : "members"}.{" "}
                  <Link href="/billing" className="font-bold underline">
                    Upgrade your plan
                  </Link>{" "}
                  to add more.
                </Alert>
              ) : (
                <StaffForm />
              )
            ) : (
              <p className="text-[12px] text-slate-500">Only the workspace owner can invite team members.</p>
            )}
          </section>

          <section className="card card-pad">
            <header className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Your account</h2>
                <p className="text-[12px] text-slate-500">Your name and the email you sign in with.</p>
              </div>
            </header>
            <ProfileForm user={user} />
          </section>

          <section className="card card-pad">
            <header className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Password</h2>
                <p className="text-[12px] text-slate-500">Use a password you don&apos;t use anywhere else.</p>
              </div>
            </header>
            <PasswordForm />
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card card-pad">
            <h2 className="flex items-center gap-1.5 text-[14px] font-bold text-slate-900">
              <Sparkles className="h-4 w-4 text-brand-600" aria-hidden="true" /> Subscription
            </h2>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-800">{plan.name}</span>
              <StatusBadge status={plan.id} kind="plan" />
            </div>
            <p className="mt-1 text-[12px] text-slate-500">
              {business.currentPeriodEnd
                ? `Renews ${formatDate(business.currentPeriodEnd)}`
                : "Free plan — no renewal"}
            </p>
            <p className="mt-2 text-[12px] text-slate-500">
              {usage.customers} customers · {usage.quotationsThisMonth} quotes this month
            </p>
            <Link href="/billing" className="btn-secondary mt-2 w-full text-[12px]">
              Manage plan
            </Link>
          </section>

          <section className="card card-pad">
            <h2 className="flex items-center gap-1.5 text-[14px] font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Security
            </h2>
            <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-slate-500">
              <li>Passwords are hashed with scrypt and a per-user salt.</li>
              <li>Sessions are httpOnly cookies with a 30-day expiry.</li>
              <li>Every database query is scoped to your business ID.</li>
              <li>Password reset links are single-use and expire in 60 minutes.</li>
            </ul>
          </section>

          <section className="card card-pad">
            <h2 className="text-[14px] font-bold text-slate-900">Demo data</h2>
            <p className="mt-1 text-[12px] text-slate-500">
              Sample customers, quotes, invoices and jobs are provided so you can see QuoteFlow working
              straight away. Delete anything you don&apos;t need.
            </p>
            <Link href="/customers" className="btn-secondary mt-2 w-full text-[12px]">
              Manage customers
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
