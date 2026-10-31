"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { customers, jobs } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { firstError, jobSchema, str, type FormState } from "@/lib/validation";

const jobStatusSchema = z.enum(["pending", "scheduled", "in_progress", "completed", "cancelled"]);

function refreshJobPaths() {
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  revalidatePath("/whatsapp");
}

export async function createJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireAuth();
  const parsed = jobSchema.safeParse({
    customerId: str(formData.get("customerId")),
    title: str(formData.get("title")),
    description: str(formData.get("description")),
    status: str(formData.get("status")) || "scheduled",
    scheduledAt: str(formData.get("scheduledAt")),
    durationMinutes: str(formData.get("durationMinutes")) || 60,
    address: str(formData.get("address")),
    assignedTo: str(formData.get("assignedTo")),
  });
  if (!parsed.success) return firstError(parsed.error);

  const [customer] = await db
    .select({ id: customers.id, address: customers.address })
    .from(customers)
    .where(and(eq(customers.id, parsed.data.customerId), eq(customers.businessId, business.id)))
    .limit(1);
  if (!customer) return { error: "That customer is not in your workspace." };

  await db.insert(jobs).values({
    businessId: business.id,
    customerId: parsed.data.customerId,
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
    durationMinutes: parsed.data.durationMinutes,
    address: parsed.data.address || customer.address,
    assignedTo: parsed.data.assignedTo,
  });

  refreshJobPaths();
  if (formData.get("returnTo") === "stay") return { ok: true, message: "Job added to the schedule." };
  redirect("/jobs?created=1");
}

export async function updateJobAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (!id) return { error: "Job not found." };

  const parsed = jobSchema.safeParse({
    customerId: str(formData.get("customerId")),
    title: str(formData.get("title")),
    description: str(formData.get("description")),
    status: str(formData.get("status")) || "scheduled",
    scheduledAt: str(formData.get("scheduledAt")),
    durationMinutes: str(formData.get("durationMinutes")) || 60,
    address: str(formData.get("address")),
    assignedTo: str(formData.get("assignedTo")),
  });
  if (!parsed.success) return firstError(parsed.error);

  await db
    .update(jobs)
    .set({
      customerId: parsed.data.customerId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      durationMinutes: parsed.data.durationMinutes,
      address: parsed.data.address,
      assignedTo: parsed.data.assignedTo,
    })
    .where(and(eq(jobs.id, id), eq(jobs.businessId, business.id)));

  refreshJobPaths();
  return { ok: true, message: "Job updated." };
}

export async function updateJobStatusAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  const status = jobStatusSchema.safeParse(str(formData.get("status")));
  if (id && status.success) {
    await db
      .update(jobs)
      .set({ status: status.data })
      .where(and(eq(jobs.id, id), eq(jobs.businessId, business.id)));
  }
  refreshJobPaths();
}

export async function deleteJobAction(formData: FormData): Promise<void> {
  const { business } = await requireAuth();
  const id = str(formData.get("id"));
  if (id) {
    await db.delete(jobs).where(and(eq(jobs.id, id), eq(jobs.businessId, business.id)));
  }
  refreshJobPaths();
}
