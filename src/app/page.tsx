"use client";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  FileText,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { demoLoginAction } from "@/app/actions/auth";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { formatMoney } from "@/lib/money";

const features = [
  {
    icon: Users,
    title: "Customers & history",
    body: "Every call, note, quote and invoice for a customer in one timeline. Search by name, number or address in a tap.",
  },
  {
    icon: FileText,
    title: "Quotations that win work",
    body: "Line-by-line pricing with VAT, automatic totals, branded PDFs and a share link customers can open on their phone.",
  },
  {
    icon: ReceiptText,
    title: "Invoices & payments",
    body: "Convert an accepted quote into an invoice in one tap. Record deposits and part payments, and see what's still owed.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp follow-ups",
    body: "Pre-written messages for quotes, reminders and thank-yous. Tap once and WhatsApp opens with the message ready.",
  },
  {
    icon: CalendarDays,
    title: "Job calendar",
    body: "Schedule visits, assign your crew, and move jobs from pending to completed with a single tap.",
  },
  {
    icon: BadgeCheck,
    title: "Multi-tenant by design",
    body: "Each business has its own isolated customers, quotes and financial records. Invite staff on paid plans.",
  },
];

const steps = [
  { title: "Add the customer", body: "Name, phone, address and a note about what they need." },
  { title: "Send the quote", body: "Build it in seconds, then WhatsApp the link or attach the PDF." },
  { title: "Get paid", body: "Accept the quote, convert to invoice, record the payment when it lands." },
];

export default function LandingPage() {
    const handleCheckout = async (priceId: string) => {
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url; // Stripe પેમેન્ટ પેજ પર જશે
      } else {
        alert("પેમેન્ટ પ્રોસેસમાં ભૂલ આવી છે.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo subtitle="Business & Customer Manager" />
          <nav className="hidden items-center gap-7 text-[13px] font-semibold text-slate-600 md:flex">
            <a href="#features" className="hover:text-brand-700">Features</a>
            <a href="#workflow" className="hover:text-brand-700">How it works</a>
            <a href="#whatsapp" className="hover:text-brand-700">WhatsApp</a>
            <a href="#pricing" className="hover:text-brand-700">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
            <Link href="/register" className="btn-primary">
              Start free <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_-10%,#dcebff_0%,rgba(255,255,255,0)_70%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-14 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-[12px] font-bold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Built for plumbers, sparkies, cleaners & gardeners
            </span>
            <h1 className="mt-5 text-[34px] leading-[1.06] font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Quote faster.
              <br />
              Get paid <span className="text-brand-600">sooner.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              QuoteFlow keeps your customers, quotations, invoices and jobs in one tidy place — with
              one-tap WhatsApp follow-ups so nothing slips through the cracks. No spreadsheets, no
              paperwork, no chasing.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Link href="/register" className="btn-primary px-5 py-3 text-[15px]">
                Start free — no card needed <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <form action={demoLoginAction}>
                <button type="submit" className="btn-secondary w-full px-5 py-3 text-[15px]">
                  Explore the live demo
                </button>
              </form>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Free plan forever
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Secure &amp; isolated data
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Set up in 2 minutes
              </span>
            </div>
          </div>
          </div>
{/* Phone mockup */}
<div className="relative mx-auto w-full max-w-[350px]">
  <div className="absolute -inset-6 -z-10 rounded-[48px] bg-gradient...">
  <div className="rounded-[34px] border border-slate-200 bg-slate...">
    <div className="overflow-hidden rounded-[26px] bg-[#f5f7fb]">
      <div className="bg-white px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="...">AquaFix Plumbers</p>
            <p className="...">Good morning. Dave</p>
          </div>
          <span className="...">
                      DC
                    </span>
                  </div>
                </div>
                <div className="space-y-2.5 p-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: "Revenue this month", value: "£3,420", tone: "text-brand-700" },
                      { label: "Outstanding", value: "£1,896", tone: "text-rose-600" },
                      { label: "Quotes pending", value: "3", tone: "text-slate-900" },
                      { label: "Jobs today", value: "2", tone: "text-slate-900" },
                    ].map((card) => (
                      <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-2.5">
                        <p className="text-[8.5px] font-semibold tracking-wide text-slate-400 uppercase">
                          {card.label}
                        </p>
                        <p className={`mt-0.5 text-[17px] font-extrabold ${card.tone}`}>{card.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-700">Revenue · last 6 months</p>
                      <p className="text-[9px] font-semibold text-emerald-600">+18%</p>
                    </div>
                    <div className="mt-2 flex h-16 items-end gap-1.5">
                      {[38, 52, 44, 68, 58, 92].map((height, index) => (
                        <div
                          key={index}
                          className={`flex-1 rounded-t ${index === 5 ? "bg-brand-600" : "bg-brand-100"}`}
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-[10px] font-bold text-slate-700">Today&apos;s jobs</p>
                    <div className="space-y-1.5">
                      {[
                        { time: "09:00", title: "Leak repair · D. Okafor" },
                        { time: "14:00", title: "Boiler service · S. Whitfield" },
                      ].map((job) => (
                        <div key={job.time} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
                          <span className="text-[9px] font-bold text-brand-600">{job.time}</span>
                          <span className="truncate text-[9.5px] font-semibold text-slate-600">{job.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#1a5fe0] px-3 py-2.5 text-white">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold">
                      <MessageCircle className="h-3 w-3" aria-hidden="true" /> Quote ready to send
                    </span>
                    <span className="rounded-md bg-white/20 px-2 py-0.5 text-[9px] font-bold">Send</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-xl sm:block">
              <p className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">Invoice paid</p>
              <p className="text-[13px] font-extrabold text-emerald-600">£1,152.00</p>
            </div>
            <div className="absolute -top-4 -right-3 hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-xl sm:block">
              <p className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-wide text-slate-400 uppercase">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" /> Quote accepted
              </p>
              <p className="text-[13px] font-extrabold text-slate-800">Sarah W.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="border-y border-slate-200 bg-slate-50/70">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 md:grid-cols-4">
          {[
            { value: "12 hrs", label: "saved per week on admin" },
            { value: "3×", label: "faster quote turnaround" },
            { value: "£1.9k", label: "average unpaid invoices recovered" },
            { value: "4.9/5", label: "from UK trade businesses" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-extrabold text-slate-900 sm:text-2xl">{stat.value}</p>
              <p className="text-[12px] text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold tracking-[0.16em] text-brand-600 uppercase">Everything in one app</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            The admin side of your trade, handled.
          </h2>
          <p className="mt-2 text-[15px] text-slate-600">
            Designed for people who work with their hands — big buttons, plain English, and everything
            reachable with a thumb.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card card-pad transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-[15px] font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-brand-600 uppercase">Customer → quote → invoice</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Three steps from enquiry to paid.
              </h2>
            </div>
            <Link href="/register" className="btn-secondary">Try it free <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <span className="absolute top-4 right-4 text-3xl font-black text-slate-200">{index + 1}</span>
                <h3 className="text-[15px] font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1.5 max-w-[85%] text-[13.5px] leading-relaxed text-slate-600">{step.body}</p>
                {index < 2 ? (
                  <ArrowRight className="absolute top-1/2 -right-2 hidden h-5 w-5 -translate-y-1/2 text-brand-300 md:block" aria-hidden="true" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp */}
      <section id="whatsapp" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp click-to-chat
          </span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Follow up where your customers actually reply.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            No WhatsApp Business API, no setup fees. QuoteFlow pre-writes the message and opens WhatsApp
            with your customer&apos;s number — quote ready, payment reminder, appointment confirmation or a
            simple thank-you.
          </p>
          <ul className="mt-5 space-y-2.5">
            {[
              "Your quote link is included automatically",
              "British English, friendly tone — edit before sending",
              "Works on any phone, no extra app to install",
              "Every follow-up logged against the customer",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-[#e9f3ea] p-4 shadow-[var(--shadow-card)] sm:p-6">
          <div className="mx-auto max-w-sm space-y-3">
            <div className="rounded-2xl rounded-tl-md bg-white p-3 text-[12.5px] leading-relaxed text-slate-700 shadow-sm">
              Hello Sarah, your quotation QT-2026-001 from AquaFix Plumbing &amp; Heating is ready — total
              £420.00.
              <br />
              <br />
              View it here: quoteflow.app/q/8f2c…
              <br />
              <br />
              Let me know if you&apos;d like to go ahead.
              <span className="mt-1 block text-right text-[10px] text-slate-400">09:14 ✓✓</span>
            </div>
            <div className="ml-auto rounded-2xl rounded-tr-md bg-[#d9fdd3] p-3 text-[12.5px] leading-relaxed text-slate-700 shadow-sm">
              Looks great — can you start Tuesday?
              <span className="mt-1 block text-right text-[10px] text-slate-500">09:18</span>
            </div>
            <div className="rounded-2xl rounded-tl-md bg-white p-3 text-[12.5px] leading-relaxed text-slate-700 shadow-sm">
              Tuesday 9am works. I&apos;ve marked the quote accepted and sent the invoice. Thanks Sarah!
              <span className="mt-1 block text-right text-[10px] text-slate-400">09:19 ✓✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-slate-200 bg-slate-50/70">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold tracking-[0.16em] text-brand-600 uppercase">Simple pricing</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              One small monthly cost. Cancel anytime.
            </h2>
            <p className="mt-2 text-[15px] text-slate-600">
              Every plan includes PDF documents, WhatsApp sharing and unlimited invoices. Start on Free,
              upgrade when you&apos;re busy.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_ORDER.map((planId) => {
              const plan = PLANS[planId];
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border bg-white p-5 ${
                    plan.highlight ? "border-brand-600 shadow-[0_20px_50px_-30px_rgba(26,95,224,0.6)]" : "border-slate-200"
                  }`}
                >
                  {plan.highlight ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                      Most popular
                    </span>
                  ) : null}
                  <p className="text-[13px] font-bold tracking-wide text-brand-600 uppercase">{plan.name}</p>
                  <p className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.priceLabel}</span>
                    <span className="text-[12px] font-medium text-slate-500">/month</span>
                  </p>
                  <p className="mt-1 min-h-9 text-[12.5px] text-slate-500">{plan.tagline}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[12.5px] text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                                {plan.id === "free" ? (
                <Link
                  href="/register"
                  className={`mt-5 w-full flex justify-center items-center ${plan.highlight ? "btn-primary" : "btn-outline"}`}
                >
                  Start free
                </Link>
              ) : (
                <button
                onClick={() => {
                  const priceId =
                    plan.id === "starter" ? process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID! :
                    plan.id === "professional" ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID! :
                    plan.id === "business" ? process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID : null;

                  if (priceId) {
                    handleCheckout(priceId);
                  } else {
                    alert("Price ID મળી નથી, કૃપા કરીને ચેક કરો.");
                  }
                }}
                className={`mt-5 w-full ${plan.highlight ? "btn-primary" : "btn-outline"}`}
              >
                Choose {plan.name}
              </button>
            )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-[12px] text-slate-500">
            Prices in GBP. VAT may apply. Stripe billing activates as soon as your payment account is connected.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo subtitle="Business & Customer Manager" />
            <p className="mt-3 max-w-sm text-[12.5px] text-slate-500">
              QuoteFlow is the pocket-sized business manager for service businesses across the UK.
              Customers, quotes, invoices, jobs and WhatsApp — sorted.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-[12.5px]">
            <div className="space-y-2">
              <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Product</p>
              <a href="#features" className="block text-slate-600 hover:text-brand-700">Features</a>
              <a href="#pricing" className="block text-slate-600 hover:text-brand-700">Pricing</a>
              <Link href="/login" className="block text-slate-600 hover:text-brand-700">Sign in</Link>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Get started</p>
              <Link href="/register" className="block text-slate-600 hover:text-brand-700">Create account</Link>
              <form action={demoLoginAction}>
                <button type="submit" className="text-left text-slate-600 hover:text-brand-700">
                  Demo workspace
                </button>
              </form>
              <Link href="/forgot-password" className="block text-slate-600 hover:text-brand-700">Reset password</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 py-4">
          <p className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 px-4 text-[11.5px] text-slate-400 sm:px-6">
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
            Made for service businesses · © {new Date().getFullYear()} Alveera Tradz Ltd
           </p>
        </div>
      </footer>
    </div>
  );
}
