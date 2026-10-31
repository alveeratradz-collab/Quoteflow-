import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { Business, Customer } from "@/db/schema";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

const BRAND = rgb(0.102, 0.373, 0.878);
const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.42, 0.47, 0.55);
const LIGHT = rgb(0.95, 0.96, 0.98);
const LINE = rgb(0.86, 0.89, 0.93);

/** Standard PDF fonts only support WinAnsi — strip anything exotic. */
function clean(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00A3/g, "\u00A3")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF\u00A3]/g, "")
    .trim();
}

function money(pence: number): string {
  const value = (pence || 0) / 100;
  return `\u00A3${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateLabel(value: string): string {
  if (!value) return "-";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return clean(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = clean(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export type PdfItem = { description: string; quantity: string; unitPricePence: number };

export type PdfDocumentInput = {
  kind: "quotation" | "invoice";
  business: Business;
  customer: Pick<Customer, "name" | "phone" | "email" | "address">;
  number: string;
  title: string;
  issueDate: string;
  secondDate: string;
  secondLabel: string;
  items: PdfItem[];
  taxRate: number;
  subtotalPence: number;
  taxPence: number;
  totalPence: number;
  notes?: string;
  terms?: string;
  status: string;
  amountPaidPence?: number;
};

export async function buildDocumentPdf(input: PdfDocumentInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(`${input.kind === "quotation" ? "Quotation" : "Invoice"} ${input.number}`);
  pdf.setAuthor(clean(input.business.name));

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT;

  const drawHeader = (first: boolean) => {
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 96, width: PAGE_WIDTH, height: 96, color: BRAND });
    page.drawText(clean(input.business.name), {
      x: MARGIN,
      y: PAGE_HEIGHT - 46,
      size: 18,
      font: bold,
      color: rgb(1, 1, 1),
    });
    const sub = [input.business.address, input.business.city, input.business.postcode].filter(Boolean).join(", ");
    page.drawText(clean(sub).slice(0, 78), {
      x: MARGIN,
      y: PAGE_HEIGHT - 64,
      size: 8.5,
      font,
      color: rgb(0.87, 0.92, 1),
    });
    page.drawText(clean([input.business.phone, input.business.email].filter(Boolean).join("  |  ")).slice(0, 86), {
      x: MARGIN,
      y: PAGE_HEIGHT - 78,
      size: 8.5,
      font,
      color: rgb(0.87, 0.92, 1),
    });
    const label = input.kind === "quotation" ? "QUOTATION" : "INVOICE";
    page.drawText(label, { x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(label, 15), y: PAGE_HEIGHT - 44, size: 15, font: bold, color: rgb(1, 1, 1) });
    page.drawText(clean(input.number), {
      x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(clean(input.number), 11),
      y: PAGE_HEIGHT - 62,
      size: 11,
      font: bold,
      color: rgb(0.9, 0.95, 1),
    });
    if (first) y = PAGE_HEIGHT - 128;
  };

  drawHeader(true);

  // Customer / meta
  page.drawText(input.kind === "quotation" ? "PREPARED FOR" : "BILLED TO", { x: MARGIN, y, size: 8, font: bold, color: MUTED });
  page.drawText(clean(input.customer?.name ?? ""), { x: MARGIN, y: y - 15, size: 11.5, font: bold, color: INK });
  let customerY = y - 29;
  for (const line of [
    input.customer?.address,
    input.customer?.phone,
    input.customer?.email,
  ].filter(Boolean) as string[]) {
    page.drawText(clean(line).slice(0, 60), { x: MARGIN, y: customerY, size: 8.5, font, color: MUTED });
    customerY -= 11;
  }

  const metaX = PAGE_WIDTH - MARGIN - 180;
  page.drawText("DETAILS", { x: metaX, y, size: 8, font: bold, color: MUTED });
  const metaRows: [string, string][] = [
    ["Issued", dateLabel(input.issueDate)],
    [input.secondLabel, dateLabel(input.secondDate)],
    ["Status", clean(input.status).toUpperCase()],
  ];
  let metaY = y - 15;
  for (const [key, value] of metaRows) {
    page.drawText(key, { x: metaX, y: metaY, size: 8.5, font, color: MUTED });
    page.drawText(value, { x: metaX + 70, y: metaY, size: 8.5, font: bold, color: INK });
    metaY -= 12;
  }

  y = Math.min(customerY, metaY) - 18;
  page.drawText(clean(input.title).slice(0, 85), { x: MARGIN, y, size: 12, font: bold, color: INK });
  y -= 20;

  // Table header
  const colDesc = MARGIN;
  const colQty = PAGE_WIDTH - MARGIN - 190;
  const colUnit = PAGE_WIDTH - MARGIN - 130;
  const colAmount = PAGE_WIDTH - MARGIN;
  page.drawRectangle({ x: MARGIN, y: y - 4, width: PAGE_WIDTH - MARGIN * 2, height: 20, color: LIGHT });
  page.drawText("DESCRIPTION", { x: colDesc + 6, y: y + 2, size: 7.5, font: bold, color: MUTED });
  page.drawText("QTY", { x: colQty, y: y + 2, size: 7.5, font: bold, color: MUTED });
  page.drawText("UNIT", { x: colUnit, y: y + 2, size: 7.5, font: bold, color: MUTED });
  page.drawText("AMOUNT", { x: colAmount - bold.widthOfTextAtSize("AMOUNT", 7.5), y: y + 2, size: 7.5, font: bold, color: MUTED });
  y -= 20;

  const ensureSpace = (needed: number) => {
    if (y - needed < 180) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawHeader(false);
      y = PAGE_HEIGHT - 128;
    }
  };

  for (const item of input.items) {
    const quantity = Number(item.quantity) || 0;
    const lineTotal = Math.round(quantity * item.unitPricePence);
    const lines = wrapText(item.description, font, 9.5, 250);
    const rowHeight = Math.max(20, lines.length * 12 + 8);
    ensureSpace(rowHeight);
    let lineY = y;
    for (const line of lines) {
      page.drawText(line, { x: colDesc + 6, y: lineY, size: 9.5, font, color: INK });
      lineY -= 12;
    }
    page.drawText(String(quantity), { x: colQty, y, size: 9.5, font, color: MUTED });
    page.drawText(money(item.unitPricePence), { x: colUnit, y, size: 9.5, font, color: MUTED });
    const amount = money(lineTotal);
    page.drawText(amount, { x: colAmount - font.widthOfTextAtSize(amount, 9.5), y, size: 9.5, font: bold, color: INK });
    y -= rowHeight;
    page.drawLine({ start: { x: MARGIN, y: y + 6 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 6 }, thickness: 0.6, color: LINE });
    y -= 6;
  }

  y -= 10;
  ensureSpace(150);

  const totalsX = PAGE_WIDTH - MARGIN - 190;
  const totals: [string, string, boolean][] = [
    ["Subtotal", money(input.subtotalPence), false],
    [`VAT (${input.taxRate}%)`, money(input.taxPence), false],
    ["Total", money(input.totalPence), true],
  ];
  if (input.kind === "invoice") {
    totals.push(["Paid", money(input.amountPaidPence ?? 0), false]);
    totals.push(["Balance due", money(input.totalPence - (input.amountPaidPence ?? 0)), true]);
  }
  for (const [label, value, strong] of totals) {
    if (strong) {
      page.drawRectangle({ x: totalsX - 8, y: y - 5, width: 198, height: 22, color: LIGHT });
    }
    page.drawText(label, { x: totalsX, y, size: strong ? 10.5 : 9.5, font: strong ? bold : font, color: strong ? INK : MUTED });
    const text = value;
    const usedFont = strong ? bold : font;
    page.drawText(text, {
      x: PAGE_WIDTH - MARGIN - usedFont.widthOfTextAtSize(text, strong ? 10.5 : 9.5) - 4,
      y,
      size: strong ? 10.5 : 9.5,
      font: usedFont,
      color: INK,
    });
    y -= strong ? 26 : 15;
  }

  const notesTop = y + 20;
  let notesY = notesTop;
  if (input.notes) {
    notesY -= 16;
    page.drawText("NOTES", { x: MARGIN, y: notesY, size: 7.5, font: bold, color: MUTED });
    notesY -= 12;
    for (const line of wrapText(input.notes, font, 8.5, 300).slice(0, 6)) {
      page.drawText(line, { x: MARGIN, y: notesY, size: 8.5, font, color: MUTED });
      notesY -= 11;
    }
  }
  if (input.terms) {
    notesY -= 8;
    page.drawText("TERMS", { x: MARGIN, y: notesY, size: 7.5, font: bold, color: MUTED });
    notesY -= 12;
    for (const line of wrapText(input.terms, font, 8.5, 300).slice(0, 6)) {
      page.drawText(line, { x: MARGIN, y: notesY, size: 8.5, font, color: MUTED });
      notesY -= 11;
    }
  }

  if (input.business.vatNumber) {
    page.drawText(`VAT number: ${clean(input.business.vatNumber)}`, { x: MARGIN, y: 72, size: 8, font, color: MUTED });
  }
  page.drawLine({ start: { x: MARGIN, y: 60 }, end: { x: PAGE_WIDTH - MARGIN, y: 60 }, thickness: 0.6, color: LINE });
  page.drawText(
    input.kind === "quotation"
      ? "Thank you for the opportunity to quote. This quotation is valid until the date shown."
      : "Thank you for your business. Please quote the invoice number with your payment.",
    { x: MARGIN, y: 46, size: 8, font, color: MUTED },
  );
  page.drawText("Generated with QuoteFlow", { x: PAGE_WIDTH - MARGIN - 100, y: 30, size: 7.5, font, color: MUTED });

  return pdf.save();
}
