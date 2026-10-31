"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  customers,
  invoiceItems,
  invoices,
  quotationItems,
  quotations,
} from "@/db/schema";
import { newToken, requireAuth } from "@/lib/auth";
import { getBusinessUsage } from "@/lib/queries";
import { parseLineItems, withTax } from "@/lib/items";
import { getPlan } from "@/lib/plans";
import { nextInvoiceNumber, nextQuotationNumber } from "@/lib/seed";
import { firstError, str, type FormState } from "@/lib/validation";
import { z } from "zod";
import { addDaysISO } from "@/lib/money";

const statusSchema = z.enum(["draft", "sent", "accepted", "rejected"]);

const quoteFormSchema = z.object({
  customerId: z.string().uuid("Choose a customer"),
  title: z.string().trim().min(3, "Add a short title for the quote"),
  issueDate: z.string().min(8, "Choose an issue date"),
  validUntil: z.string().min(8, "Choose a valid-until date"),
  taxRate: z.coerce.number().min(0).max(100),
  status: statusSchema.default("draft"),
  notes: z.string().trim().max(2000).optional().default(""),
  terms: z.string().trim().max(2000).optional().default(""),
});

function revalidateQuotePaths(id?: string) {
  revalidatePath("/quotations");
  revalidatePath("/dashboard");
  revalidatePath("/whatsapp");
  if (id) revalidatePath(`/quotations/${id}`);
}

export async function createQuotationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireAuth();
  const parsed = quoteFormSchema.safeParse({
    customerId: str(formData.get("customerId")),
    title: str(formData.get("title")),
    issueDate: str(formData.get("issueDate")),
    validUntil: str(formData.get("validUntil")),
    taxRate: str(formData.get("taxRate")) || String(business.taxRate),
    status: str(formData.get("status")) || "draft",
    notes: str(formData.get("notes")),
    terms: str(formData.get("terms")),
  });
  if (!parsed.success) return firstError(parsed.error);

  const itemsResult = parseLineItems(formData.get("items"));
  if (!itemsResult.totals || !itemsResult.totals.items.length) {
    return { error: itemsResult.error ?? "Add at least one item." };
  }

  const plan = getPlan(business.plan);
  const usage = await getBusinessUsage(business.id);
  if (usage.quotationsThisMonth >= plan.maxQuotationsPerMonth) {
    return {
      error: `Your ${plan.name} plan allows ${plan.maxQuotationsPerMonth} quotations per month. Upgrade for more.`,
    };
  }

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, parsed.data.customerId), eq(customers.businessId, business.id)))
    .limit(1);
  if (!customer) return { error: "That customer is not in your workspace." };

  const totals = withTax(itemsResult.totals.items, parsed.data.taxRate);
  const number = await nextQuotationNumber(business.id);

  const [created] = await db
    .insert(quotations)
    .values({
      businessId: business.id,
      customerId: parsed.data.customerId,
      number,
      status: parsed.data.status,
      title: parsed.data.title,
      issueDate: parsed.data.issueDate,
      validUntil: parsed.data.validUntil,
      taxRate: totals.taxRate,
      subtotalPence: totals.subtotalPence,
      taxPence: totals.taxPence,
      totalPence: totals.totalPence,
      notes: parsed.data.notes,
      terms: parsed.data.terms,
      shareToken: newToken(12),
    })
    .returning({ id: quotations.id });

  await db.insert(quotationItems).values(
    totals.items.map((item, index) => ({
      quotationId: created.id,
      description: item.description,
      quantity: item.quantity.toFixed(2),
      unitPricePence: item.unitPricePence,
      position: index,
    })),
  );

  revalidateQuotePaths(created.id);

  if (formData.get("returnTo") === "list") {
    redirect(`/quotations?created=${encodeURIComponent(number)}`);
  }
  redirect(`/quotations/${created.id}?created=1`);
}

export async function updateQuotationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (!id) return { error: "Quotation not found." };

  const parsed = quoteFormSchema.safeParse({
    customerId: str(formData.get("customerId")),
    title: str(formData.get("title")),
    issueDate: str(formData.get("issueDate")),
    validUntil: str(formData.get("validUntil")),
    taxRate: str(formData.get("taxRate")) || String(business.taxRate),
    status: str(formData.get("status")) || "draft",
    notes: str(formData.get("notes")),
    terms: str(formData.get("terms")),
  });
  if (!parsed.success) return firstError(parsed.error);

  const itemsResult = parseLineItems(formData.get("items"));
  if (!itemsResult.totals || !itemsResult.totals.items.length) {
    return { error: itemsResult.error ?? "Add at least one item." };
  }
  const totals = withTax(itemsResult.totals.items, parsed.data.taxRate);

  const [existing] = await db
    .select({ id: quotations.id, number: quotations.number })
    .from(quotations)
    .where(and(eq(quotations.id, id), eq(quotations.businessId, business.id)))
    .limit(1);
  if (!existing) return { error: "Quotation not found." };

  await db
    .update(quotations)
    .set({
      customerId: parsed.data.customerId,
      title: parsed.data.title,
      issueDate: parsed.data.issueDate,
      validUntil: parsed.data.validUntil,
      status: parsed.data.status,
      taxRate: totals.taxRate,
      subtotalPence: totals.subtotalPence,
      taxPence: totals.taxPence,
      totalPence: totals.totalPence,
      notes: parsed.data.notes,
      terms: parsed.data.terms,
    })
    .where(and(eq(quotations.id, id), eq(quotations.businessId, business.id)));

  await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
  await db.insert(quotationItems).values(
    totals.items.map((item, index) => ({
      quotationId: id,
      description: item.description,
      quantity: item.quantity.toFixed(2),
      unitPricePence: item.unitPricePence,
      position: index,
    })),
  );

  revalidateQuotePaths(id);
  return { ok: true, message: `Quotation ${existing.number} updated.` };
}

export async function updateQuotationStatusAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  const status = statusSchema.safeParse(str(formData.get("status")));
  if (id && status.success) {
    await db
      .update(quotations)
      .set({ status: status.data })
      .where(and(eq(quotations.id, id), eq(quotations.businessId, business.id)));
  }
  revalidateQuotePaths(id);
  revalidatePath("/quotations");
}

export async function deleteQuotationAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (id) {
    await db.delete(quotations).where(and(eq(quotations.id, id), eq(quotations.businessId, business.id)));
  }
  revalidateQuotePaths();
  redirect("/quotations?deleted=1");
}

export async function duplicateQuotationAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (!id) redirect("/quotations");

  const [quote] = await db
    .select()
    .from(quotations)
    .where(and(eq(quotations.id, id), eq(quotations.businessId, business.id)))
    .limit(1);
  if (!quote) redirect("/quotations");

  const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
  const number = await nextQuotationNumber(business.id);
  const issueDate = new Date().toISOString().slice(0, 10);

  const [created] = await db
    .insert(quotations)
    .values({
      businessId: business.id,
      customerId: quote.customerId,
      number,
      status: "draft",
      title: `${quote.title} (copy)`,
      issueDate,
      validUntil: addDaysISO(30),
      taxRate: quote.taxRate,
      subtotalPence: quote.subtotalPence,
      taxPence: quote.taxPence,
      totalPence: quote.totalPence,
      notes: quote.notes,
      terms: quote.terms,
      shareToken: newToken(12),
    })
    .returning({ id: quotations.id });

  if (items.length) {
    await db.insert(quotationItems).values(
      items.map((item) => ({
        quotationId: created.id,
        description: item.description,
        quantity: item.quantity,
        unitPricePence: item.unitPricePence,
        position: item.position,
      })),
    );
  }

  revalidateQuotePaths(created.id);
  redirect(`/quotations/${created.id}`);
}

/** Customer-to-quotation-to-invoice workflow in one tap. */
export async function convertQuotationToInvoiceAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (!id) redirect("/quotations");

  const [quote] = await db
    .select()
    .from(quotations)
    .where(and(eq(quotations.id, id), eq(quotations.businessId, business.id)))
    .limit(1);
  if (!quote) redirect("/quotations");

  const existing = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.businessId, business.id), eq(invoices.quotationId, quote.id)))
    .limit(1);
  if (existing.length > 0) {
    redirect(`/invoices/${existing[0].id}?exists=1`);
  }

  const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, quote.id));
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, quote.customerId), eq(customers.businessId, business.id)))
    .limit(1);
  if (!customer) redirect("/quotations");

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

  revalidateQuotePaths(id);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(`/invoices/${invoice.id}?fromQuote=1`);
}
