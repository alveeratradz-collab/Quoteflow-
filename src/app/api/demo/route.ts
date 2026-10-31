import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, customers, invoices, jobs, quotations, users } from "@/db/schema";
import { DEMO_EMAIL, ensureDemoWorkspace } from "@/lib/demo";

export const dynamic = "force-dynamic";

/** Prepares the shared demo workspace (idempotent). Useful for resets & smoke tests. */
export async function GET() {
  try {
    await ensureDemoWorkspace();
    const [owner] = await db
      .select({ businessId: users.businessId })
      .from(users)
      .where(eq(users.email, DEMO_EMAIL))
      .limit(1);
    if (!owner) return NextResponse.json({ ok: false, error: "Demo workspace unavailable" }, { status: 500 });

    const [business] = await db.select().from(businesses).where(eq(businesses.id, owner.businessId)).limit(1);
    const [customerCount] = await db
      .select({ value: count() })
      .from(customers)
      .where(eq(customers.businessId, owner.businessId));
    const [quoteCount] = await db
      .select({ value: count() })
      .from(quotations)
      .where(eq(quotations.businessId, owner.businessId));
    const [invoiceCount] = await db
      .select({ value: count() })
      .from(invoices)
      .where(eq(invoices.businessId, owner.businessId));
    const [jobCount] = await db
      .select({ value: count() })
      .from(jobs)
      .where(eq(jobs.businessId, owner.businessId));

    return NextResponse.json({
      ok: true,
      workspace: business?.name ?? null,
      counts: {
        customers: customerCount?.value ?? 0,
        quotations: quoteCount?.value ?? 0,
        invoices: invoiceCount?.value ?? 0,
        jobs: jobCount?.value ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Demo seeding failed" },
      { status: 500 },
    );
  }
}
