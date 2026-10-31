"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { str, type FormState } from "@/lib/validation";
import { z } from "zod";

const planSchema = z.enum(["free", "starter", "professional", "business"]);

export async function changePlanAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireOwner();
  const parsed = planSchema.safeParse(str(formData.get("plan")));
  if (!parsed.success) return { error: "Choose a valid plan." };
  const plan = getPlan(parsed.data);

  if (plan.id !== "free" && process.env.STRIPE_SECRET_KEY) {
    // Live Stripe checkout: subscription architecture is ready, keys are read
    // from the environment only (never exposed to the client).
    try {
      const headerList = await headers();
      const host = headerList.get("host") ?? "localhost:3000";
      const proto = headerList.get("x-forwarded-proto") ?? "http";
      const origin = `${proto}://${host}`;

      const body = new URLSearchParams();
      body.set("mode", "subscription");
      body.set("success_url", `${origin}/billing?checkout=success&plan=${plan.id}`);
      body.set("cancel_url", `${origin}/billing?checkout=cancelled`);
      body.set("client_reference_id", business.id);
      body.set("customer_email", business.email || "owner@example.com");
      body.set("line_items[0][quantity]", "1");
      body.set("line_items[0][price_data][currency]", "gbp");
      body.set("line_items[0][price_data][unit_amount]", String(plan.pricePence));
      body.set("line_items[0][price_data][recurring][interval]", "month");
      body.set("line_items[0][price_data][product_data][name]", `QuoteFlow ${plan.name}`);
      body.set("metadata[businessId]", business.id);
      body.set("metadata[plan]", plan.id);
      body.set("subscription_data[metadata][businessId]", business.id);

      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const json = (await response.json()) as { url?: string; error?: { message?: string } };
      if (!response.ok || !json.url) {
        return { error: json.error?.message ?? "Stripe checkout could not be started." };
      }
      redirect(json.url);
    } catch (error) {
      if (typeof error === "object" && error !== null && "digest" in error) throw error;
      return { error: "We couldn't reach Stripe. Please try again." };
    }
  }

  // No Stripe credentials configured: activate the plan in demo mode so the
  // full product can be evaluated. Real billing starts as soon as keys exist.
  await db
    .update(businesses)
    .set({
      plan: plan.id,
      planStatus: plan.id === "free" ? "active" : "active",
      currentPeriodEnd: plan.id === "free" ? null : new Date(Date.now() + 30 * 86_400_000),
      stripeSubscriptionId: null,
    })
    .where(eq(businesses.id, business.id));

  revalidatePath("/billing");
  revalidatePath("/dashboard");
  revalidatePath("/settings");

  return {
    ok: true,
    message:
      plan.id === "free"
        ? "You're on the Free plan."
        : `${plan.name} activated for 30 days. Stripe isn't connected yet, so no payment was taken.`,
  };
}

export async function cancelPlanAction(): Promise<void> {
  const { business } = await requireOwner();
  await db
    .update(businesses)
    .set({ plan: "free", planStatus: "active", currentPeriodEnd: null, stripeSubscriptionId: null })
    .where(eq(businesses.id, business.id));
  revalidatePath("/billing");
  revalidatePath("/dashboard");
  redirect("/billing?cancelled=1");
}
