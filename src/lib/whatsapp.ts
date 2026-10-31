export type WhatsAppTemplateId =
  | "quotation_ready"
  | "quotation_followup"
  | "invoice_outstanding"
  | "invoice_reminder"
  | "job_scheduled"
  | "thank_you";

export type WhatsAppTemplate = {
  id: WhatsAppTemplateId;
  label: string;
  description: string;
  build: (vars: TemplateVars) => string;
};

export type TemplateVars = {
  customerName?: string;
  businessName?: string;
  reference?: string;
  amount?: string;
  date?: string;
  link?: string;
};

const firstName = (name?: string) => (name ? name.trim().split(" ")[0] : "there");

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "quotation_ready",
    label: "Quotation ready",
    description: "Send a new quotation to a customer.",
    build: (v) =>
      `Hello ${firstName(v.customerName)}, your quotation ${v.reference ?? ""} from ${
        v.businessName ?? "us"
      } is ready${v.amount ? ` — total ${v.amount}` : ""}.${v.link ? `\n\nView it here: ${v.link}` : ""}\n\nLet me know if you'd like to go ahead.`,
  },
  {
    id: "quotation_followup",
    label: "Follow up on quotation",
    description: "Nudge a customer who hasn't replied.",
    build: (v) =>
      `Hi ${firstName(v.customerName)}, just following up on quotation ${v.reference ?? ""} from ${
        v.businessName ?? "us"
      }.${v.link ? `\n\nYou can view it here: ${v.link}` : ""}\n\nHappy to answer any questions or adjust anything.`,
  },
  {
    id: "invoice_outstanding",
    label: "Invoice outstanding",
    description: "Friendly nudge about an unpaid invoice.",
    build: (v) =>
      `Hi ${firstName(v.customerName)}, a quick reminder that invoice ${v.reference ?? ""}${
        v.amount ? ` (${v.amount})` : ""
      } is still outstanding${v.date ? ` and was due on ${v.date}` : ""}.${v.link ? `\n\nInvoice: ${v.link}` : ""}\n\nThank you!`,
  },
  {
    id: "invoice_reminder",
    label: "Polite payment reminder",
    description: "Softer reminder with payment details.",
    build: (v) =>
      `Hello ${firstName(v.customerName)}, I hope you're well. This is a polite reminder about invoice ${
        v.reference ?? ""
      }${v.amount ? ` for ${v.amount}` : ""}${v.date ? ` due ${v.date}` : ""}. If you've already paid, please ignore this message. — ${v.businessName ?? "us"}`,
  },
  {
    id: "job_scheduled",
    label: "Job scheduled",
    description: "Confirm an appointment time.",
    build: (v) =>
      `Hi ${firstName(v.customerName)}, your job with ${v.businessName ?? "us"} is booked${
        v.date ? ` for ${v.date}` : ""
      }. We'll message you when we're on the way. Thank you!`,
  },
  {
    id: "thank_you",
    label: "Thank you",
    description: "Say thanks after a completed job.",
    build: (v) =>
      `Thank you for choosing ${v.businessName ?? "our service"}, ${firstName(
        v.customerName,
      )}! It was a pleasure working with you. If you need anything else, just message us here.`,
  },
];

export const templateById = (id: string): WhatsAppTemplate =>
  WHATSAPP_TEMPLATES.find((template) => template.id === id) ?? WHATSAPP_TEMPLATES[0];

/** Normalise a UK/international phone number into wa.me digits. */
export function normalisePhone(raw: string): string {
  const digits = (raw || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `44${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const number = normalisePhone(phone);
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function isWhatsAppConfigured(): boolean {
  return false;
}
