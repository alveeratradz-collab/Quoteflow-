import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { getPublicQuotation } from "@/lib/queries";
import { DocumentPreview } from "@/components/document-preview";
import { Alert } from "@/components/ui";
import { acceptQuotationByTokenAction } from "@/app/actions/public";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Your quotation" };

export default async function PublicQuotationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ accepted?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const data = await getPublicQuotation(token);
  if (!data) notFound();

  const { quote, customer, business, items } = data;
  const contactMessage = `Hello, I've reviewed quotation ${quote.number} for ${formatMoney(quote.totalPence)}.`;

  return (
    <div className="min-h-dvh bg-slate-100/70">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-brand-600 uppercase">Quotation from</p>
            <p className="text-[15px] font-extrabold text-slate-900">{business.name}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] font-semibold text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Secure link
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 py-5 sm:px-4">
        {query.accepted ? (
          <div className="mb-4">
            <Alert tone="success">
              Thanks — this quotation has been marked as accepted. {business.name} will be in touch to
              arrange the work.
            </Alert>
          </div>
        ) : null}

        <DocumentPreview
          kind="quotation"
          business={business}
          customer={customer}
          number={quote.number}
          title={quote.title}
          issueDate={quote.issueDate}
          secondDate={quote.validUntil}
          secondLabel="Valid until"
          items={items}
          taxRate={quote.taxRate}
          subtotalPence={quote.subtotalPence}
          taxPence={quote.taxPence}
          totalPence={quote.totalPence}
          notes={quote.notes}
          terms={quote.terms}
          status={quote.status}
        />

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          {quote.status === "accepted" ? (
            <p className="flex items-center gap-2 text-[13.5px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> You&apos;ve accepted this quotation — thank
              you!
            </p>
          ) : (
            <>
              <p className="text-[13.5px] font-semibold text-slate-800">Happy to go ahead?</p>
              <p className="mt-0.5 text-[12.5px] text-slate-500">
                Accept the quote below, or message {business.name} with any questions.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <form action={acceptQuotationByTokenAction} className="flex-1">
                  <input type="hidden" name="token" value={token} />
                  <button type="submit" className="btn-primary w-full">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Accept this quotation
                  </button>
                </form>
                <a
                  href={buildWhatsAppLink(business.phone, contactMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Message on WhatsApp
                </a>
              </div>
            </>
          )}
          <div className="mt-3 border-t border-slate-100 pt-3 text-[11.5px] text-slate-500">
            Questions? Call {business.phone || "us"} or email {business.email || "us"}. This link belongs to{" "}
            {customer.name}.
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          Powered by{" "}
          <Link href="/" className="font-semibold text-brand-600">
            QuoteFlow
          </Link>{" "}
          · Business &amp; customer manager for service businesses
        </p>
      </main>
    </div>
  );
}
