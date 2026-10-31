import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const planEnum = pgEnum("qf_plan", [
  "free",
  "starter",
  "professional",
  "business",
]);

export const roleEnum = pgEnum("qf_role", ["owner", "staff"]);

export const quotationStatusEnum = pgEnum("qf_quotation_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
]);

export const invoiceStatusEnum = pgEnum("qf_invoice_status", [
  "unpaid",
  "paid",
]);

export const jobStatusEnum = pgEnum("qf_job_status", [
  "pending",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const customerStatusEnum = pgEnum("qf_customer_status", [
  "lead",
  "active",
]);

/* ------------------------------------------------------------------ */
/* Businesses & users (multi-tenant root)                              */
/* ------------------------------------------------------------------ */

export const businesses = pgTable("qf_businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  postcode: text("postcode").notNull().default(""),
  vatNumber: text("vat_number").notNull().default(""),
  website: text("website").notNull().default(""),
  taxRate: integer("tax_rate").notNull().default(20),
  currency: text("currency").notNull().default("GBP"),
  plan: planEnum("plan").notNull().default("free"),
  planStatus: text("plan_status").notNull().default("active"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "qf_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("owner"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("qf_users_email_unique").on(table.email)],
);

export const sessions = pgTable("qf_sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("qf_password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export const customers = pgTable("qf_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  status: customerStatusEnum("status").notNull().default("active"),
  source: text("source").notNull().default("manual"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customerNotes = pgTable("qf_customer_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  authorName: text("author_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Quotations                                                          */
/* ------------------------------------------------------------------ */

export const quotations = pgTable("qf_quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  status: quotationStatusEnum("status").notNull().default("draft"),
  title: text("title").notNull().default(""),
  issueDate: date("issue_date").notNull(),
  validUntil: date("valid_until").notNull(),
  taxRate: integer("tax_rate").notNull().default(20),
  subtotalPence: integer("subtotal_pence").notNull().default(0),
  taxPence: integer("tax_pence").notNull().default(0),
  totalPence: integer("total_pence").notNull().default(0),
  notes: text("notes").notNull().default(""),
  terms: text("terms").notNull().default(""),
  shareToken: text("share_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotationItems = pgTable("qf_quotation_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id")
    .notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPricePence: integer("unit_price_pence").notNull().default(0),
  position: integer("position").notNull().default(0),
});

/* ------------------------------------------------------------------ */
/* Invoices & payments                                                 */
/* ------------------------------------------------------------------ */

export const invoices = pgTable("qf_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  quotationId: uuid("quotation_id").references(() => quotations.id, {
    onDelete: "set null",
  }),
  number: text("number").notNull(),
  status: invoiceStatusEnum("status").notNull().default("unpaid"),
  title: text("title").notNull().default(""),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  taxRate: integer("tax_rate").notNull().default(20),
  subtotalPence: integer("subtotal_pence").notNull().default(0),
  taxPence: integer("tax_pence").notNull().default(0),
  totalPence: integer("total_pence").notNull().default(0),
  amountPaidPence: integer("amount_paid_pence").notNull().default(0),
  notes: text("notes").notNull().default(""),
  shareToken: text("share_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceItems = pgTable("qf_invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPricePence: integer("unit_price_pence").notNull().default(0),
  position: integer("position").notNull().default(0),
});

export const payments = pgTable("qf_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  amountPence: integer("amount_pence").notNull(),
  method: text("method").notNull().default("bank_transfer"),
  reference: text("reference").notNull().default(""),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

export const jobs = pgTable("qf_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: jobStatusEnum("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  address: text("address").notNull().default(""),
  assignedTo: text("assigned_to").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Business = typeof businesses.$inferSelect;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Quotation = typeof quotations.$inferSelect;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Plan = (typeof planEnum.enumValues)[number];
export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
export type QuotationStatus = (typeof quotationStatusEnum.enumValues)[number];
