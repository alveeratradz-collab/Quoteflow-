import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { seedBusinessData } from "@/lib/seed";

export const DEMO_EMAIL = "demo@quoteflow.app";
export const DEMO_PASSWORD = "quoteflow123";

/** Creates (once) a fully populated demo workspace. Safe to call repeatedly. */
export async function ensureDemoWorkspace(): Promise<void> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEMO_EMAIL))
    .limit(1);
  if (existing.length > 0) return;

  try {
    const [business] = await db
      .insert(businesses)
      .values({
        name: "AquaFix Plumbing & Heating",
        ownerName: "Dave Carter",
        email: DEMO_EMAIL,
        phone: "0113 496 0180",
        address: "Unit 4, Kirkstall Business Park",
        city: "Leeds",
        postcode: "LS5 3BX",
        vatNumber: "GB 482 991 302",
        website: "aquafixplumbing.co.uk",
        taxRate: 20,
        plan: "professional",
        planStatus: "active",
        trialEndsAt: new Date(Date.now() + 7 * 86_400_000),
        currentPeriodEnd: new Date(Date.now() + 24 * 86_400_000),
      })
      .returning();

    await db.insert(users).values({
      businessId: business.id,
      name: "Dave Carter",
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      role: "owner",
    });

    await db.insert(users).values({
      businessId: business.id,
      name: "Sam Reed",
      email: "sam@aquafixplumbing.co.uk",
      passwordHash: await hashPassword(DEMO_PASSWORD),
      role: "staff",
    });

    await seedBusinessData(business.id, 20);
  } catch (error) {
    // Another request may have created it concurrently — ignore duplicates.
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("duplicate key")) throw error;
  }
}
