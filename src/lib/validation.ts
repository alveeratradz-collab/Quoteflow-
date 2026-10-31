import { z } from "zod";

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  resetLink?: string;
};

export const emptyFormState: FormState = {};

export function firstError(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    error: error.issues[0]?.message ?? "Please check the form and try again.",
    fieldErrors,
  };
}

export function str(value: FormDataEntryValue | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  businessName: z.string().trim().min(2, "Enter your business name"),
  email: emailSchema,
  password: passwordSchema,
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative").max(100, "Max 100%"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a contact phone number")
    .max(30, "Phone number is too long")
    .regex(/^[+\d][\d\s()-]{6,}$/, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal(""))
    .transform((v) => v ?? ""),
  address: z.string().trim().max(400, "Address is too long").optional().default(""),
  status: z.enum(["lead", "active"]).default("active"),
  notes: z.string().trim().max(2000, "Notes are too long").optional().default(""),
});

export const jobSchema = z.object({
  customerId: z.string().uuid("Choose a customer"),
  title: z.string().trim().min(3, "Add a short job title"),
  description: z.string().trim().max(2000).optional().default(""),
  status: z.enum(["pending", "scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  scheduledAt: z.string().trim().optional().default(""),
  durationMinutes: z.coerce.number().min(15, "Minimum 15 minutes").max(1440, "Maximum 24 hours"),
  address: z.string().trim().max(400).optional().default(""),
  assignedTo: z.string().trim().max(120).optional().default(""),
});

export const businessSchema = z.object({
  name: z.string().trim().min(2, "Business name is required"),
  ownerName: z.string().trim().max(120).optional().default(""),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal(""))
    .transform((v) => v ?? ""),
  phone: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().max(400).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  postcode: z.string().trim().max(20).optional().default(""),
  vatNumber: z.string().trim().max(40).optional().default(""),
  website: z.string().trim().max(200).optional().default(""),
  taxRate: z.coerce.number().min(0, "Cannot be negative").max(100, "Max 100%"),
});

export const staffSchema = z.object({
  name: z.string().trim().min(2, "Enter the team member's name"),
  email: emailSchema,
  password: passwordSchema,
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: emailSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: passwordSchema,
});

export const lineItemSchema = z.object({
  description: z.string().trim().min(2, "Every line needs a description"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0").max(10000, "Quantity too large"),
  unitPricePence: z.number().min(0, "Price cannot be negative"),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;
