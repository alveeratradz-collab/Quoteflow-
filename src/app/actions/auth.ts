"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { businesses, passwordResetTokens, users } from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  newToken,
  verifyPassword,
} from "@/lib/auth";
import { DEMO_EMAIL, ensureDemoWorkspace } from "@/lib/demo";
import { seedBusinessData } from "@/lib/seed";
import {
  firstError,
  loginSchema,
  passwordSchema,
  registerSchema,
  str,
  type FormState,
} from "@/lib/validation";

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: str(formData.get("name")),
    businessName: str(formData.get("businessName")),
    email: str(formData.get("email")),
    password: str(formData.get("password")),
    taxRate: str(formData.get("taxRate")) || 20,
  });
  if (!parsed.success) return firstError(parsed.error);

  const { name, businessName, email, password, taxRate } = parsed.data;
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { error: "An account with this email already exists.", fieldErrors: { email: "Email already registered" } };
  }

  const seedSamples = formData.get("seedSamples") === "on";

  try {
    const [business] = await db
      .insert(businesses)
      .values({
        name: businessName,
        ownerName: name,
        email,
        taxRate: taxRate ?? 20,
        plan: "free",
        planStatus: "active",
      })
      .returning();

    const [user] = await db
      .insert(users)
      .values({
        businessId: business.id,
        name,
        email,
        passwordHash: await hashPassword(password),
        role: "owner",
        lastLoginAt: new Date(),
      })
      .returning();

    if (seedSamples) {
      await seedBusinessData(business.id, business.taxRate);
    }

    await createSession(user.id);
  } catch (error) {
    if (isRedirect(error)) throw error;
    return { error: "We couldn't create your account. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard?welcome=1");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: str(formData.get("email")),
    password: str(formData.get("password")),
  });
  if (!parsed.success) return firstError(parsed.error);

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!user || !user.isActive) {
    return { error: "Incorrect email or password." };
  }
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Incorrect email or password." };

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function demoLoginAction(): Promise<void> {
  await ensureDemoWorkspace();
  const [user] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (!user) redirect("/login?error=demo");
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect("/dashboard?demo=1");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/login?loggedOut=1");
}

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = str(formData.get("email")).toLowerCase();
  if (!email) return { error: "Enter the email linked to your account." };

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return {
      ok: true,
      message:
        "If an account exists for that email, a reset link has been created. Check your inbox and spam folder.",
    };
  }

  const token = newToken(24);
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  // Email delivery isn't configured in this environment. The secure, single-use
  // link is surfaced so password resets can be completed and tested end-to-end.
  return {
    ok: true,
    message: "Reset link created. It expires in 60 minutes and can only be used once.",
    resetLink: `/reset-password?token=${token}`,
  } as FormState & { resetLink: string };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = str(formData.get("token"));
  const password = str(formData.get("password"));
  const confirm = str(formData.get("confirmPassword"));

  if (!token) return { error: "This reset link is invalid. Request a new one." };
  const passwordCheck = passwordSchema.safeParse(password);
  if (!passwordCheck.success) return { error: passwordCheck.error.issues[0]?.message };
  if (password !== confirm) return { error: "Passwords do not match." };

  const [reset] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!reset || reset.usedAt || reset.expiresAt.getTime() < Date.now()) {
    return { error: "This reset link has expired or already been used." };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(users.id, reset.userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, reset.id));

  return { ok: true, message: "Password updated. You can now sign in with your new password." };
}
