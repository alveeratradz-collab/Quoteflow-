import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ReceiptText, UserPlus } from "lucide-react";
import { and, asc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { getCustomerOptions } from "@/lib/queries";
import { db } from "@/db";
import { quotationItems, quotations } from "@/db/schema";
import { EmptyState, LinkButton } from "@/components/ui";
import { DocumentForm } from "@/components/document-forms";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; quotationId?: string }>;
}) {
  const { business } = await requireAuth();
  const params = await searchParams;
  const customers = await getCustomerOptions(business.id);

  let initialValues;
  if (params.quotationId) {
    const [quote] = await db
      .select()
      .from(quotations)
      .where(and(eq(quotations.id, params.quotationId), eq(quotations.businessId, business.id)))
      .limit(1);
    if (quote) {
      const items = await db
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, quote.id))
        .orderBy(asc(quotationItems.position));
      initialValues = {
        customerId: quote.customerId,
        title: quote.title,
        taxRate: quote.taxRate,
        notes: quote.notes,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPricePence: item.unitPricePence,
        })),
      };
    }
  }

  return (
    <div>
      <Link href="/invoices" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to invoices
      </Link>
      <div className="mb-5">
        <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-brand-600 uppercase">New invoice</p>
        <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-slate-900">Create an invoice</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track the balance automatically, record payments as they arrive and send reminders.
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
            title="Add a customer first"
            description="Invoices are attached to a customer so you can see everything they owe."
            action={
              <LinkButton href="/customers?new=1">
                <UserPlus className="h-4 w-4" aria-hidden="true" /> Add a customer
              </LinkButton>
            }
          />
        </div>
      ) : (
        <DocumentForm
          kind="invoice"
          customers={customers}
          businessTaxRate={business.taxRate}
          defaultCustomerId={params.customerId ?? initialValues?.customerId}
          initialValues={initialValues}
          quotationId={params.quotationId}
        />
      )}
    </div>
  );
}
