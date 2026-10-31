import { lineItemSchema } from "@/lib/validation";

export type ParsedItem = {
  description: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
};

export type Totals = {
  items: ParsedItem[];
  subtotalPence: number;
  taxRate: number;
  taxPence: number;
  totalPence: number;
};

export function parseLineItems(raw: FormDataEntryValue | null): { totals?: Totals; error?: string } {
  if (typeof raw !== "string" || !raw.trim()) {
    return { error: "Add at least one service or product line." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Could not read the line items. Please try again." };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { error: "Add at least one service or product line." };
  }

  const items: ParsedItem[] = [];
  for (const row of parsed) {
    const candidate = lineItemSchema.safeParse({
      description: String((row as Record<string, unknown>)?.description ?? "").trim(),
      quantity: Number((row as Record<string, unknown>)?.quantity ?? 0),
      unitPricePence: Math.round(Number((row as Record<string, unknown>)?.unitPricePence ?? 0)),
    });
    if (!candidate.success) {
      return { error: candidate.error.issues[0]?.message ?? "Invalid line item." };
    }
    const { description, quantity, unitPricePence } = candidate.data;
    items.push({
      description,
      quantity,
      unitPricePence,
      lineTotalPence: Math.round(quantity * unitPricePence),
    });
  }
  return { totals: withTax(items, 0) };
}

export function withTax(items: ParsedItem[], taxRate: number): Totals {
  const subtotalPence = items.reduce((sum, item) => sum + item.lineTotalPence, 0);
  const safeRate = Number.isFinite(taxRate) ? Math.max(0, Math.min(100, Math.round(taxRate))) : 0;
  const taxPence = Math.round((subtotalPence * safeRate) / 100);
  return {
    items,
    subtotalPence,
    taxRate: safeRate,
    taxPence,
    totalPence: subtotalPence + taxPence,
  };
}
