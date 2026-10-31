"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { customers, invoiceItems, invoices, payments, quotationItems, quotations } from "@/db/schema";
import { newToken, requireAuth } from "@/lib/auth";
import { parseLineItems, withTax } from "@/lib/items";
import { addDaysISO, parseMoneyToPence } from "@/lib/money";
import { nextInvoiceNumber } from "@/lib/seed";
import { firstError, str, type FormState } from "@/lib/validation";

const invoiceFormSchema = z.object({
  customerId: z.string().uuid("Choose a customer"),
  title: z.string().trim().min(3, "Add a short description for the invoice"),
  issueDate: z.string().min(8, "Choose an issue date"),
  dueDate: z.string().min(8, "Choose a due date"),
  taxRate: z.coerce.number().min(0).max(100),
  notes: z.string().trim().max(2000).optional().default(""),
  quotationId: z.string().optional().default(""),
});

function refreshInvoicePaths(id?: string) {
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  revalidatePath("/whatsapp");
  if (id) revalidatePath(`/invoices/${id}`);
}

export async function createInvoiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireAuth();
  const parsed = invoiceFormSchema.safeParse({
    customerId: str(formData.get("customerId")),
    title: str(formData.get("title")),
    issueDate: str(formData.get("issueDate")),
    dueDate: str(formData.get("dueDate")),
    taxRate: str(formData.get("taxRate")) || String(business.taxRate),
    notes: str(formData.get("notes")),
    quotationId: str(formData.get("quotationId")),
  });
  if (!parsed.success) return firstError(parsed.error);

  if (parsed.data.dueDate < parsed.data.issueDate) {
    return { fieldErrors: { dueDate: "Due date must be after the issue date" }, error: "Due date must be after the issue date." };
  }

  const itemsResult = parseLineItems(formData.get("items"));
  if (!itemsResult.totals || !itemsResult.totals.items.length) {
    return { error: itemsResult.error ?? "Add at least one item." };
  }

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, parsed.data.customerId), eq(customers.businessId, business.id)))
    .limit(1);
  if (!customer) return { error: "That customer is not in your workspace." };

  let quotationId: string | null = null;
  if (parsed.data.quotationId) {
    const [quote] = await db
      .select({ id: quotations.id })
      .from(quotations)
      .where(and(eq(quotations.id, parsed.data.quotationId), eq(quotations.businessId, business.id)))
      .limit(1);
    quotationId = quote?.id ?? null;
  }

  const totals = withTax(itemsResult.totals.items, parsed.data.taxRate);
  const number = await nextInvoiceNumber(business.id);

  const [created] = await db
    .insert(invoices)
    .values({
      businessId: business.id,
      customerId: parsed.data.customerId,
      quotationId,
      number,
      title: parsed.data.title,
      issueDate: parsed.data.issueDate,
      dueDate: parsed.data.dueDate,
      taxRate: totals.taxRate,
      subtotalPence: totals.subtotalPence,
      taxPence: totals.taxPence,
      totalPence: totals.totalPence,
      notes: parsed.data.notes,
      shareToken: newToken(12),
    })
    .returning({ id: invoices.id });

  await db.insert(invoiceItems).values(
    totals.items.map((item, index) => ({
      invoiceId: created.id,
      description: item.description,
      quantity: item.quantity.toFixed(2),
      unitPricePence: item.unitPricePence,
      position: index,
    })),
  );

  refreshInvoicePaths(created.id);
  redirect(`/invoices/${created.id}?created=${encodeURIComponent(number)}`);
}

export async function createInvoiceFromQuotationAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const quotationId = str(formData.get("quotationId"));
  if (!quotationId) redirect("/invoices");

  const [quote] = await db
    .select()
    .from(quotations)
    .where(and(eq(quotations.id, quotationId), eq(quotations.businessId, business.id)))
    .limit(1);
  if (!quote) redirect("/invoices");

  const existing = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.businessId, business.id), eq(invoices.quotationId, quote.id)))
    .limit(1);
  if (existing.length) redirect(`/invoices/${existing[0].id}`);

  const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quote.id));
  const number = await nextInvoiceNumber(business.id);
  const issueDate = new Date().toISOString().slice(0, 10);

  const [invoice] = await db
    .insert(invoices)
    .values({
      businessId: business.id,
      customerId: quote.customerId,
      quotationId: quote.id,
      number,
      status: "unpaid",
      title: quote.title,
      issueDate,
      dueDate: addDaysISO(14),
      taxRate: quote.taxRate,
      subtotalPence: quote.subtotalPence,
      taxPence: quote.taxPence,
      totalPence: quote.totalPence,
      notes: quote.notes,
      shareToken: newToken(12),
    })
    .returning({ id: invoices.id });

  if (items.length) {
    await db.insert(invoiceItems).values(
      items.map((item) => ({
        invoiceId: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPricePence: item.unitPricePence,
        position: item.position,
      })),
    );
  }

  await db
    .update(quotations)
    .set({ status: "accepted" })
    .where(and(eq(quotations.id, quote.id), eq(quotations.businessId, business.id)));

  refreshInvoicePaths(invoice.id);
  redirect(`/invoices/${invoice.id}?fromQuote=1`);
}

export async function recordPaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireAuth();
  const invoiceId = str(formData.get("invoiceId"));
  const method = str(formData.get("method")) || "bank_transfer";
  const reference = str(formData.get("reference"));
  const rawAmount = str(formData.get("amount"));

  if (!invoiceId) return { error: "Invoice not found." };

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, business.id)))
    .limit(1);
  if (!invoice) return { error: "Invoice not found." };

  const outstanding = invoice.totalPence - invoice.amountPaidPence;
  const amount = formData.get("payFull") === "on" || !rawAmount ? outstanding : parseMoneyToPence(rawAmount);

  if (amount <= 0) return { error: "Enter a payment amount greater than £0." };
  if (amount > outstanding) {
    return { error: `That's more than the outstanding balance of £${(outstanding / 100).toFixed(2)}.` };
  }

  await db.insert(payments).values({
    businessId: business.id,
    invoiceId: invoice.id,
    amountPence: amount,
    method,
    reference,
  });

  const newPaid = invoice.amountPaidPence + amount;
  await db
    .update(invoices)
    .set({
      amountPaidPence: newPaid,
      status: newPaid >= invoice.totalPence ? "paid" : "unpaid",
    })
    .where(and(eq(invoices.id, invoice.id), eq(invoices.businessId, business.id)));

  refreshInvoicePaths(invoice.id);
  return {
    ok: true,
    message:
      newPaid >= invoice.totalPence
        ? `${invoice.number} is now fully paid. Nice one!`
        : `Payment recorded. £${((invoice.totalPence - newPaid) / 100).toFixed(2)} still outstanding.`,
  };
}

export async function markInvoicePaidAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (!id) redirect("/invoices");

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.businessId, business.id)))
    .limit(1);
  if (!invoice) redirect("/invoices");

  const due = invoice.totalPence - invoice.amountPaidPence;
  if (due > 0) {
    await db.insert(payments).values({
      businessId: business.id,
      invoiceId: invoice.id,
      amountPence: due,
      method: "bank_transfer",
      reference: "Balance settled",
    });
  }
  await db
    .update(invoices)
    .set({ amountPaidPence: invoice.totalPence, status: "paid" })
    .where(and(eq(invoices.id, invoice.id), eq(invoices.businessId, business.id)));

  refreshInvoicePaths(id);
}

export async function deleteInvoiceAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (id) {
    await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.businessId, business.id)));
  }
  refreshInvoicePaths();
  redirect("/invoices?deleted=1");
}
