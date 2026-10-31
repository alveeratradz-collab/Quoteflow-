import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Star } from "lucide-react";
import { Logo } from "@/components/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="flex min-h-dvh flex-col bg-white">
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Logo subtitle="Business & Customer Manager" />
          <Link href="/" className="text-[12.5px] font-semibold text-slate-500 hover:text-brand-700">
            Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="px-5 pb-5 text-center text-[11.5px] text-slate-400 sm:px-8">
          © {new Date().getFullYear()} QuoteFlow · Secure, isolated business data
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,#ffffff_0,transparent_45%),radial-gradient(circle_at_80%_70%,#8ebeff_0,transparent_40%)]" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11.5px] font-bold tracking-wide">
            <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" aria-hidden="true" />
            Trusted by UK trade businesses
          </span>
          <h2 className="mt-6 max-w-sm text-3xl leading-tight font-extrabold tracking-tight">
            Stop quoting from the van on the back of a receipt.
          </h2>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-brand-50/90">
            Send professional quotes, keep every customer detail, and get paid without the awkward
            phone calls.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              "A branded quote on their phone in 60 seconds",
              "Automatic VAT, totals and PDF downloads",
              "WhatsApp reminders that sound like you",
              "Every payment tracked, nothing lost",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-white/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mt-10 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
          <p className="text-[13px] leading-relaxed text-white/95">
            &ldquo;I used to lose track of who owed me what. Now I send the quote on WhatsApp from the
            driveway and the invoice goes out the same day.&rdquo;
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
              DC
            </span>
            <p className="text-[12px] text-brand-50/80">
              Dave C. · Plumbing &amp; heating · Leeds
            </p>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-200">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> 4.9/5 average rating
          </p>
        </div>
      </aside>
    </div>
  );
}
