"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { hashPassword, requireAuth, requireOwner, verifyPassword } from "@/lib/auth";
import { getBusinessUsage } from "@/lib/queries";
import { getPlan } from "@/lib/plans";
import {
  businessSchema,
  changePasswordSchema,
  firstError,
  profileSchema,
  staffSchema,
  str,
  type FormState,
} from "@/lib/validation";

export async function updateBusinessAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireAuth();
  const parsed = businessSchema.safeParse({
    name: str(formData.get("name")),
    ownerName: str(formData.get("ownerName")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    address: str(formData.get("address")),
    city: str(formData.get("city")),
    postcode: str(formData.get("postcode")),
    vatNumber: str(formData.get("vatNumber")),
    website: str(formData.get("website")),
    taxRate: str(formData.get("taxRate")) || 20,
  });
  if (!parsed.success) return firstError(parsed.error);

  await db
    .update(businesses)
    .set(parsed.data)
    .where(eq(businesses.id, business.id));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true, message: "Business profile saved." };
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireAuth();
  const parsed = profileSchema.safeParse({
    name: str(formData.get("name")),
    email: str(formData.get("email")),
  });
  if (!parsed.success) return firstError(parsed.error);

  const duplicate = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (duplicate.length && duplicate[0].id !== user.id) {
    return { fieldErrors: { email: "That email is already in use" }, error: "That email is already in use." };
  }

  await db.update(users).set(parsed.data).where(eq(users.id, user.id));
  revalidatePath("/settings");
  return { ok: true, message: "Your details are up to date." };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireAuth();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: str(formData.get("currentPassword")),
    newPassword: str(formData.get("newPassword")),
  });
  if (!parsed.success) return firstError(parsed.error);

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { fieldErrors: { currentPassword: "Current password is incorrect" }, error: "Current password is incorrect." };

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.newPassword) })
    .where(eq(users.id, user.id));
  return { ok: true, message: "Password changed." };
}

export async function addStaffAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireOwner();
  const parsed = staffSchema.safeParse({
    name: str(formData.get("name")),
    email: str(formData.get("email")),
    password: str(formData.get("password")),
  });
  if (!parsed.success) return firstError(parsed.error);

  const plan = getPlan(business.plan);
  const usage = await getBusinessUsage(business.id);
  if (usage.staff >= plan.maxStaff) {
    return {
      error:
        plan.maxStaff === 0
          ? "Team members are available on paid plans. Upgrade to invite your crew."
          : `Your ${plan.name} plan includes ${plan.maxStaff} team member(s). Upgrade to add more.`,
    };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing.length) return { fieldErrors: { email: "An account with this email already exists" }, error: "An account with this email already exists." };

  await db.insert(users).values({
    businessId: business.id,
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    role: "staff",
  });

  revalidatePath("/settings");
  return { ok: true, message: `${parsed.data.name} can now sign in with those details.` };
}

export async function setStaffActiveAction(formData: FormData): Promise<void> {
  const { business, user } = await requireOwner();
  const id = str(formData.get("id"));
  const isActive = str(formData.get("isActive")) === "true";
  if (id && id !== user.id) {
    await db
      .update(users)
      .set({ isActive })
      .where(and(eq(users.id, id), eq(users.businessId, business.id)));
  }
  revalidatePath("/settings");
}

export async function removeStaffAction(formData: FormData): Promise<void> {
  const { business, user } = await requireOwner();
  const id = str(formData.get("id"));
  if (id && id !== user.id) {
    await db.delete(users).where(and(eq(users.id, id), eq(users.businessId, business.id)));
  }
  revalidatePath("/settings");
}
