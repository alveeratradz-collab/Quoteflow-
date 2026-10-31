import type { Plan } from "@/db/schema";

export type PlanDefinition = {
  id: Plan;
  name: string;
  pricePence: number;
  priceLabel: string;
  tagline: string;
  maxCustomers: number;
  maxQuotationsPerMonth: number;
  maxStaff: number;
  features: string[];
  highlight?: boolean;
};

export const PLANS: Record<Plan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    pricePence: 0,
    priceLabel: "£0",
    tagline: "Try QuoteFlow with a small customer list.",
    maxCustomers: 5,
    maxQuotationsPerMonth: 3,
    maxStaff: 0,
    features: [
      "5 customers",
      "3 quotations per month",
      "Unlimited invoices",
      "PDF quotes & invoices",
      "WhatsApp click-to-chat",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    pricePence: 900,
    priceLabel: "£9",
    tagline: "For solo trades getting organised.",
    maxCustomers: 100,
    maxQuotationsPerMonth: 30,
    maxStaff: 1,
    features: [
      "100 customers",
      "30 quotations per month",
      "Unlimited invoices & jobs",
      "Payment tracking",
      "WhatsApp follow-up templates",
    ],
  },
  professional: {
    id: "professional",
    name: "Professional",
    pricePence: 1900,
    priceLabel: "£19",
    tagline: "For busy teams that quote every day.",
    maxCustomers: 1000,
    maxQuotationsPerMonth: 300,
    maxStaff: 3,
    features: [
      "1,000 customers",
      "300 quotations per month",
      "3 team members",
      "Job calendar & scheduling",
      "Revenue reports",
    ],
    highlight: true,
  },
  business: {
    id: "business",
    name: "Business",
    pricePence: 3900,
    priceLabel: "£39",
    tagline: "For growing companies with crews.",
    maxCustomers: Number.POSITIVE_INFINITY,
    maxQuotationsPerMonth: Number.POSITIVE_INFINITY,
    maxStaff: 10,
    features: [
      "Unlimited customers",
      "Unlimited quotations",
      "10 team members",
      "Priority support",
      "Everything in Professional",
    ],
  },
};

export const PLAN_ORDER: Plan[] = ["free", "starter", "professional", "business"];

export function getPlan(plan: string | null | undefined): PlanDefinition {
  if (plan && plan in PLANS) return PLANS[plan as Plan];
  return PLANS.free;
}

export function planLimitLabel(limit: number): string {
  return Number.isFinite(limit) ? String(limit) : "Unlimited";
}

export type UsageSummary = {
  plan: PlanDefinition;
  customers: { used: number; limit: number };
  quotations: { used: number; limit: number };
  staff: { used: number; limit: number };
};
