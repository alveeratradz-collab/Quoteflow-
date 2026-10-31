"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { quotations } from "@/db/schema";

export async function acceptQuotationByTokenAction(formData: FormData): Promise<void> {
  const token = typeof formData.get("token") === "string" ? String(formData.get("token")) : "";
  if (!token) redirect("/");
  const [quote] = await db
    .select({ id: quotations.id, status: quotations.status })
    .from(quotations)
    .where(eq(quotations.shareToken, token))
    .limit(1);
  if (!quote) redirect("/");
  await db.update(quotations).set({ status: "accepted" }).where(eq(quotations.id, quote.id));
  revalidatePath(`/q/${token}`);
  redirect(`/q/${token}?accepted=1`);
}
