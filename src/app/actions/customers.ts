"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { customerNotes, customers } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { getBusinessUsage } from "@/lib/queries";
import { getPlan } from "@/lib/plans";
import { customerSchema, firstError, str, type FormState } from "@/lib/validation";

function refreshCustomerPages(customerId?: string) {
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  if (customerId) revalidatePath(`/customers/${customerId}`);
}

export async function createCustomerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireAuth();
  const parsed = customerSchema.safeParse({
    name: str(formData.get("name")),
    phone: str(formData.get("phone")),
    email: str(formData.get("email")),
    address: str(formData.get("address")),
    status: str(formData.get("status")) || "active",
    notes: str(formData.get("notes")),
  });
  if (!parsed.success) return firstError(parsed.error);

  const plan = getPlan(business.plan);
  const usage = await getBusinessUsage(business.id);
  if (usage.customers >= plan.maxCustomers) {
    return {
      error: `Your ${plan.name} plan includes ${plan.maxCustomers} customers. Upgrade to add more.`,
    };
  }

  const [created] = await db
    .insert(customers)
    .values({ ...parsed.data, businessId: business.id, source: "manual" })
    .returning({ id: customers.id });

  refreshCustomerPages();
  if (formData.get("stayOnPage") === "on") {
    return { ok: true, message: "Customer added." };
  }
  redirect(`/customers/${created.id}?created=1`);
}

export async function updateCustomerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (!id) return { error: "Customer not found." };

  const parsed = customerSchema.safeParse({
    name: str(formData.get("name")),
    phone: str(formData.get("phone")),
    email: str(formData.get("email")),
    address: str(formData.get("address")),
    status: str(formData.get("status")) || "active",
    notes: str(formData.get("notes")),
  });
  if (!parsed.success) return firstError(parsed.error);

  await db
    .update(customers)
    .set(parsed.data)
    .where(and(eq(customers.id, id), eq(customers.businessId, business.id)));

  refreshCustomerPages(id);
  return { ok: true, message: "Customer details updated." };
}

export async function addCustomerNoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, business } = await requireAuth();
  const customerId = str(formData.get("customerId"));
  const body = str(formData.get("body"));
  if (!customerId) return { error: "Customer not found." };
  if (body.length < 2) return { error: "Write a note before saving." };

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.businessId, business.id)))
    .limit(1);
  if (!customer) return { error: "Customer not found." };

  await db.insert(customerNotes).values({
    businessId: business.id,
    customerId,
    body: body.slice(0, 2000),
    authorName: user.name,
  });

  refreshCustomerPages(customerId);
  return { ok: true, message: "Note saved." };
}

export async function deleteCustomerAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (id) {
    await db.delete(customers).where(and(eq(customers.id, id), eq(customers.businessId, business.id)));
  }
  refreshCustomerPages();
  redirect("/customers?deleted=1");
}

export async function convertEnquiryAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (id) {
    await db
      .update(customers)
      .set({ status: "active" })
      .where(and(eq(customers.id, id), eq(customers.businessId, business.id)));
  }
  refreshCustomerPages(id);
  redirect("/customers?converted=1");
}
