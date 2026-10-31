import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  customerNotes,
  customers,
  invoiceItems,
  invoices,
  jobs,
  payments,
  quotationItems,
  quotations,
} from "@/db/schema";
import { newToken } from "@/lib/auth";

export async function nextQuotationNumber(businessId: string): Promise<string> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quotations)
    .where(eq(quotations.businessId, businessId));
  const year = new Date().getFullYear();
  return `QT-${year}-${String((row?.count ?? 0) + 1).padStart(3, "0")}`;
}

export async function nextInvoiceNumber(businessId: string): Promise<string> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(eq(invoices.businessId, businessId));
  const year = new Date().getFullYear();
  return `INV-${year}-${String((row?.count ?? 0) + 1).padStart(3, "0")}`;
}

const iso = (date: Date) => date.toISOString().slice(0, 10);
const daysFromNow = (days: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

type SeedCustomer = {
  name: string;
  phone: string;
  email: string;
  address: string;
  status: "lead" | "active";
  notes: string;
};

const SEED_CUSTOMERS: SeedCustomer[] = [
  {
    name: "Sarah Whitfield",
    phone: "07700 900123",
    email: "sarah.whitfield@example.com",
    address: "14 Maple Grove, Leeds LS7 2QT",
    status: "active",
    notes: "Prefers WhatsApp. Has a Worcester boiler serviced every autumn.",
  },
  {
    name: "Daniel Okafor",
    phone: "07700 900456",
    email: "daniel.okafor@example.com",
    address: "8 Bramley Close, Manchester M14 5RG",
    status: "active",
    notes: "Landlord with 3 properties — always needs itemised quotes.",
  },
  {
    name: "Priya Shah",
    phone: "07700 900789",
    email: "priya.shah@example.com",
    address: "22 Kingsway Court, Birmingham B15 2TT",
    status: "lead",
    notes: "Enquiry from Facebook. Wants bathroom leak looked at this week.",
  },
  {
    name: "Tom & Becky Hall",
    phone: "07700 900234",
    email: "becky.hall@example.com",
    address: "3 Orchard Rise, Bristol BS6 7HN",
    status: "active",
    notes: "Repeat customer. Kitchen refit booked for spring.",
  },
  {
    name: "Nadia Ahmed",
    phone: "07700 900876",
    email: "nadia.ahmed@example.com",
    address: "Flat 5, 91 Chester Road, London N19 5DF",
    status: "lead",
    notes: "Needs a gas safety certificate before Friday.",
  },
  {
    name: "Michael Brennan",
    phone: "07700 900543",
    email: "michael.brennan@example.com",
    address: "17 Wharf Lane, Sheffield S1 4QZ",
    status: "active",
    notes: "Pays by bank transfer, usually within 3 days.",
  },
  {
    name: "Greenleaf Lettings",
    phone: "07700 900678",
    email: "maintenance@greenleaflettings.example.com",
    address: "Suite 2, 40 Station Road, Nottingham NG1 6GA",
    status: "active",
    notes: "Agency account. Send invoices to maintenance@ address.",
  },
  {
    name: "Emma Sutherland",
    phone: "07700 900321",
    email: "emma.sutherland@example.com",
    address: "5 Rosewood Gardens, Edinburgh EH3 8AB",
    status: "lead",
    notes: "Instagram enquiry about radiator replacement.",
  },
];

type SeedQuote = {
  customerIndex: number;
  title: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  daysAgo: number;
  items: { description: string; quantity: number; unitPricePence: number }[];
  notes?: string;
};

const SEED_QUOTES: SeedQuote[] = [
  {
    customerIndex: 0,
    title: "Annual boiler service & radiator flush",
    status: "sent",
    daysAgo: 2,
    items: [
      { description: "Annual boiler service", quantity: 1, unitPricePence: 9500 },
      { description: "Radiator flush (7 radiators)", quantity: 7, unitPricePence: 4500 },
      { description: "Magnetic filter installation", quantity: 1, unitPricePence: 18000 },
    ],
    notes: "Includes 12-month workmanship guarantee.",
  },
  {
    customerIndex: 1,
    title: "Emergency leak repair – 8 Bramley Close",
    status: "accepted",
    daysAgo: 6,
    items: [
      { description: "Emergency call-out (same day)", quantity: 1, unitPricePence: 12000 },
      { description: "Replace flexible tap connector", quantity: 2, unitPricePence: 3500 },
      { description: "Labour", quantity: 3, unitPricePence: 6500 },
    ],
  },
  {
    customerIndex: 3,
    title: "Kitchen plumbing first fix",
    status: "sent",
    daysAgo: 4,
    items: [
      { description: "First fix pipework", quantity: 1, unitPricePence: 48000 },
      { description: "Waste & supply for appliances", quantity: 4, unitPricePence: 8500 },
    ],
  },
  {
    customerIndex: 6,
    title: "Greenleaf – quarterly maintenance visit",
    status: "draft",
    daysAgo: 0,
    items: [
      { description: "Quarterly landlord maintenance visit", quantity: 3, unitPricePence: 15000 },
      { description: "Gas safety certificates", quantity: 3, unitPricePence: 6000 },
    ],
  },
  {
    customerIndex: 5,
    title: "Bathroom mixer tap replacement",
    status: "rejected",
    daysAgo: 14,
    items: [{ description: "Replace basin mixer tap", quantity: 1, unitPricePence: 14000 }],
    notes: "Customer went with a cheaper quote.",
  },
];

export async function seedBusinessData(businessId: string, taxRate: number) {
  const insertedCustomers = await db
    .insert(customers)
    .values(
      SEED_CUSTOMERS.map((customer, index) => ({
        businessId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        status: customer.status,
        source: index % 3 === 0 ? "referral" : index % 3 === 1 ? "whatsapp" : "website",
        notes: customer.notes,
        createdAt: daysFromNow(-30 + index * 3),
      })),
    )
    .returning({ id: customers.id, name: customers.name, phone: customers.phone });

  await db.insert(customerNotes).values([
    {
      businessId,
      customerId: insertedCustomers[0].id,
      body: "Called about a noisy boiler — booked a site visit for next Tuesday.",
      authorName: "You",
    },
    {
      businessId,
      customerId: insertedCustomers[1].id,
      body: "Asked for all quotes to be itemised with VAT shown separately.",
      authorName: "You",
    },
  ]);

  const year = new Date().getFullYear();
  let invoiceSeq = 0;
  const createdInvoices: { id: string; total: number; status: "unpaid" | "paid"; daysAgo: number }[] = [];

  for (let i = 0; i < SEED_QUOTES.length; i += 1) {
    const quote = SEED_QUOTES[i];
    const subtotal = quote.items.reduce(
      (sum, item) => sum + Math.round(item.quantity * item.unitPricePence),
      0,
    );
    const tax = Math.round((subtotal * taxRate) / 100);
    const issue = daysFromNow(-quote.daysAgo);
    const [createdQuote] = await db
      .insert(quotations)
      .values({
        businessId,
        customerId: insertedCustomers[quote.customerIndex].id,
        number: `QT-${year}-${String(i + 1).padStart(3, "0")}`,
        status: quote.status,
        title: quote.title,
        issueDate: iso(issue),
        validUntil: iso(new Date(issue.getTime() + 30 * 86_400_000)),
        taxRate,
        subtotalPence: subtotal,
        taxPence: tax,
        totalPence: subtotal + tax,
        notes: quote.notes ?? "Prices valid for 30 days. Payment due on completion.",
        terms: "50% deposit required to book. Work guaranteed for 12 months.",
        shareToken: newToken(12),
        createdAt: issue,
      })
      .returning({ id: quotations.id });

    await db.insert(quotationItems).values(
      quote.items.map((item, index) => ({
        quotationId: createdQuote.id,
        description: item.description,
        quantity: item.quantity.toFixed(2),
        unitPricePence: item.unitPricePence,
        position: index,
      })),
    );

    // Accepted quotes have generated an invoice.
    if (quote.status === "accepted") {
      invoiceSeq += 1;
      const invoiceCreated = daysFromNow(-quote.daysAgo + 1);
      const [createdInvoice] = await db
        .insert(invoices)
        .values({
          businessId,
          customerId: insertedCustomers[quote.customerIndex].id,
          quotationId: createdQuote.id,
          number: `INV-${year}-${String(invoiceSeq).padStart(3, "0")}`,
          status: "unpaid",
          title: quote.title,
          issueDate: iso(invoiceCreated),
          dueDate: iso(new Date(invoiceCreated.getTime() + 14 * 86_400_000)),
          taxRate,
          subtotalPence: subtotal,
          taxPence: tax,
          totalPence: subtotal + tax,
          notes: "Bank transfer: QuoteFlow Demo Ltd · Sort 04-00-04 · Acc 12345678",
          shareToken: newToken(12),
        })
        .returning({ id: invoices.id });
      await db.insert(invoiceItems).values(
        quote.items.map((item, index) => ({
          invoiceId: createdInvoice.id,
          description: item.description,
          quantity: item.quantity.toFixed(2),
          unitPricePence: item.unitPricePence,
          position: index,
        })),
      );
      createdInvoices.push({ id: createdInvoice.id, total: subtotal + tax, status: "unpaid", daysAgo: quote.daysAgo });
    }
  }

  // Extra paid invoices spread over previous months for the revenue chart.
  const paidSpecs = [
    { customerIndex: 3, title: "Bathroom install – final payment", amount: 96000, daysAgo: 8 },
    { customerIndex: 4, title: "Gas safety certificate", amount: 7200, daysAgo: 26 },
    { customerIndex: 5, title: "Boiler repair – parts & labour", amount: 22400, daysAgo: 44 },
    { customerIndex: 6, title: "Landlord maintenance – Q1", amount: 54000, daysAgo: 70 },
    { customerIndex: 0, title: "Outdoor tap installation", amount: 16800, daysAgo: 100 },
    { customerIndex: 1, title: "Shower pump replacement", amount: 38500, daysAgo: 130 },
  ];

  for (const spec of paidSpecs) {
    invoiceSeq += 1;
    const created = daysFromNow(-spec.daysAgo);
    const net = Math.round(spec.amount / (1 + taxRate / 100));
    const tax = spec.amount - net;
    const [createdInvoice] = await db
      .insert(invoices)
      .values({
        businessId,
        customerId: insertedCustomers[spec.customerIndex].id,
        number: `INV-${year}-${String(invoiceSeq).padStart(3, "0")}`,
        status: "paid",
        title: spec.title,
        issueDate: iso(created),
        dueDate: iso(new Date(created.getTime() + 14 * 86_400_000)),
        taxRate,
        subtotalPence: net,
        taxPence: tax,
        totalPence: spec.amount,
        amountPaidPence: spec.amount,
        notes: "",
        shareToken: newToken(12),
        createdAt: created,
      })
      .returning({ id: invoices.id });
    await db.insert(invoiceItems).values({
      invoiceId: createdInvoice.id,
      description: spec.title,
      quantity: "1.00",
      unitPricePence: net,
      position: 0,
    });
    await db.insert(payments).values({
      businessId,
      invoiceId: createdInvoice.id,
      amountPence: spec.amount,
      method: "bank_transfer",
      reference: "BACS",
      paidAt: created,
      createdAt: created,
    });
  }

  // One partially paid invoice so outstanding balances are realistic.
  const [partialInvoice] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.businessId, businessId), eq(invoices.status, "unpaid")))
    .limit(1);
  if (partialInvoice) {
    const [inv] = await db
      .select({ total: invoices.totalPence, id: invoices.id })
      .from(invoices)
      .where(eq(invoices.id, partialInvoice.id));
    const deposit = Math.round(inv.total / 2);
    await db
      .update(invoices)
      .set({ amountPaidPence: deposit })
      .where(eq(invoices.id, inv.id));
    await db.insert(payments).values({
      businessId,
      invoiceId: inv.id,
      amountPence: deposit,
      method: "card",
      reference: "Deposit",
    });
  }

  await db.insert(jobs).values([
    {
      businessId,
      customerId: insertedCustomers[1].id,
      title: "Leak repair follow-up",
      description: "Check the joint under the kitchen sink and replace the washer if needed.",
      status: "scheduled",
      scheduledAt: daysFromNow(0, 9),
      durationMinutes: 90,
      address: "8 Bramley Close, Manchester M14 5RG",
      assignedTo: "Dave",
    },
    {
      businessId,
      customerId: insertedCustomers[0].id,
      title: "Annual boiler service",
      description: "Service Worcester boiler, check pressure and flue.",
      status: "scheduled",
      scheduledAt: daysFromNow(0, 14),
      durationMinutes: 60,
      address: "14 Maple Grove, Leeds LS7 2QT",
      assignedTo: "You",
    },
    {
      businessId,
      customerId: insertedCustomers[4].id,
      title: "Gas safety certificate",
      description: "CP12 for one-bed flat, tenant will be home from 10am.",
      status: "in_progress",
      scheduledAt: daysFromNow(0, 11),
      durationMinutes: 60,
      address: "Flat 5, 91 Chester Road, London N19 5DF",
      assignedTo: "Dave",
    },
    {
      businessId,
      customerId: insertedCustomers[3].id,
      title: "Kitchen first fix site visit",
      description: "Measure up and agree pipe routes with the customer.",
      status: "scheduled",
      scheduledAt: daysFromNow(2, 10),
      durationMinutes: 120,
      address: "3 Orchard Rise, Bristol BS6 7HN",
      assignedTo: "You",
    },
    {
      businessId,
      customerId: insertedCustomers[6].id,
      title: "Greenleaf quarterly inspection",
      description: "Three flats, check for leaks and test smoke alarms.",
      status: "pending",
      scheduledAt: daysFromNow(5, 8),
      durationMinutes: 180,
      address: "Suite 2, 40 Station Road, Nottingham NG1 6GA",
      assignedTo: "Sam",
    },
    {
      businessId,
      customerId: insertedCustomers[5].id,
      title: "Bathroom tap replacement",
      description: "Completed – new mixer tap fitted, old waste cleaned.",
      status: "completed",
      scheduledAt: daysFromNow(-3, 10),
      durationMinutes: 75,
      address: "17 Wharf Lane, Sheffield S1 4QZ",
      assignedTo: "You",
    },
  ]);
}
