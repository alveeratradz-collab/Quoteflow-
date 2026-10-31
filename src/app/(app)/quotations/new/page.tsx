import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, UserPlus } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getCustomerOptions } from "@/lib/queries";
import { EmptyState, LinkButton } from "@/components/ui";
import { DocumentForm } from "@/components/document-forms";

export const metadata: Metadata = { title: "New quotation" };

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { business } = await requireAuth();
  const params = await searchParams;
  const customers = await getCustomerOptions(business.id);

  return (
    <div>
      <Link href="/quotations" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to quotations
      </Link>
      <div className="mb-5">
        <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-brand-600 uppercase">New quotation</p>
        <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-slate-900">Build a professional quote</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add your services and prices — VAT and totals are calculated automatically.
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText className="h-5 w-5" aria-hidden="true" />}
            title="Add a customer first"
            description="Quotes are always attached to a customer so you can track the history."
            action={
              <LinkButton href="/customers?new=1">
                <UserPlus className="h-4 w-4" aria-hidden="true" /> Add a customer
              </LinkButton>
            }
          />
        </div>
      ) : (
        <DocumentForm
          kind="quotation"
          customers={customers}
          businessTaxRate={business.taxRate}
          defaultCustomerId={params.customerId}
        />
      )}
    </div>
  );
}
