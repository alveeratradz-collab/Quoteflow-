import { and, asc, count, desc, eq, gte, inArray, lt, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  businesses,
  customerNotes,
  customers,
  invoiceItems,
  invoices,
  jobs,
  payments,
  quotationItems,
  quotations,
  users,
} from "@/db/schema";

export type MonthPoint = { label: string; total: number };

export async function getDashboardData(businessId: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86_400_000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    customerCount,
    enquiryCount,
    pendingQuote,
    acceptedQuote,
    invoiceAgg,
    paidAgg,
    monthRevenue,
    lastMonthRevenue,
    todaysJobs,
    recentQuotations,
    recentInvoices,
    revenueSeries,
    quoteStatusRows,
    paymentMethods,
  ] = await Promise.all([
    db.select({ value: count() }).from(customers).where(eq(customers.businessId, businessId)),
    db
      .select({ value: count() })
      .from(customers)
      .where(and(eq(customers.businessId, businessId), eq(customers.status, "lead"))),
    db
      .select({ value: count(), total: sql<number>`coalesce(sum(${quotations.totalPence}), 0)::int` })
      .from(quotations)
      .where(and(eq(quotations.businessId, businessId), inArray(quotations.status, ["draft", "sent"]))),
    db
      .select({ value: count(), total: sql<number>`coalesce(sum(${quotations.totalPence}), 0)::int` })
      .from(quotations)
      .where(and(eq(quotations.businessId, businessId), eq(quotations.status, "accepted"))),
    db
      .select({
        value: count(),
        total: sql<number>`coalesce(sum(${invoices.totalPence}), 0)::int`,
        paid: sql<number>`coalesce(sum(${invoices.amountPaidPence}), 0)::int`,
      })
      .from(invoices)
      .where(and(eq(invoices.businessId, businessId), eq(invoices.status, "unpaid"))),
    db
      .select({ total: sql<number>`coalesce(sum(${payments.amountPence}), 0)::int` })
      .from(payments)
      .where(eq(payments.businessId, businessId)),
    db
      .select({ total: sql<number>`coalesce(sum(${payments.amountPence}), 0)::int` })
      .from(payments)
      .where(and(eq(payments.businessId, businessId), gte(payments.paidAt, startOfMonth))),
    db
      .select({ total: sql<number>`coalesce(sum(${payments.amountPence}), 0)::int` })
      .from(payments)
      .where(
        and(
          eq(payments.businessId, businessId),
          gte(payments.paidAt, startOfLastMonth),
          lt(payments.paidAt, startOfMonth),
        ),
      ),
    db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        scheduledAt: jobs.scheduledAt,
        address: jobs.address,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(jobs)
      .innerJoin(customers, eq(customers.id, jobs.customerId))
      .where(
        and(
          eq(jobs.businessId, businessId),
          gte(jobs.scheduledAt, startOfToday),
          lt(jobs.scheduledAt, endOfToday),
        ),
      )
      .orderBy(asc(jobs.scheduledAt)),
    db
      .select({
        id: quotations.id,
        number: quotations.number,
        title: quotations.title,
        status: quotations.status,
        totalPence: quotations.totalPence,
        issueDate: quotations.issueDate,
        customerName: customers.name,
        customerId: customers.id,
        shareToken: quotations.shareToken,
      })
      .from(quotations)
      .innerJoin(customers, eq(customers.id, quotations.customerId))
      .where(eq(quotations.businessId, businessId))
      .orderBy(desc(quotations.createdAt))
      .limit(5),
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        title: invoices.title,
        status: invoices.status,
        dueDate: invoices.dueDate,
        totalPence: invoices.totalPence,
        amountPaidPence: invoices.amountPaidPence,
        customerName: customers.name,
      })
      .from(invoices)
      .innerJoin(customers, eq(customers.id, invoices.customerId))
      .where(eq(invoices.businessId, businessId))
      .orderBy(desc(invoices.createdAt))
      .limit(5),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${payments.paidAt}), 'YYYY-MM')`,
        total: sql<number>`coalesce(sum(${payments.amountPence}), 0)::int`,
      })
      .from(payments)
      .where(and(eq(payments.businessId, businessId), gte(payments.paidAt, new Date(now.getFullYear(), now.getMonth() - 5, 1))))
      .groupBy(sql`date_trunc('month', ${payments.paidAt})`)
      .orderBy(sql`date_trunc('month', ${payments.paidAt})`),
    db
      .select({ status: quotations.status, value: count(), total: sql<number>`coalesce(sum(${quotations.totalPence}), 0)::int` })
      .from(quotations)
      .where(eq(quotations.businessId, businessId))
      .groupBy(quotations.status),
    db
      .select({
        value: count(),
        overdue: sql<number>`count(*) filter (where ${invoices.amountPaidPence} < ${invoices.totalPence} and ${invoices.dueDate} < current_date)::int`,
      })
      .from(invoices)
      .where(and(eq(invoices.businessId, businessId), eq(invoices.status, "unpaid"))),
  ]);

  const unpaid = invoiceAgg[0] ?? { value: 0, total: 0, paid: 0 };
  const outstanding = Math.max(0, Number(unpaid.total) - Number(unpaid.paid));

  const series: MonthPoint[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const found = revenueSeries.find((row) => row.month === key);
    series.push({
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      total: Number(found?.total ?? 0),
    });
  }

  const paid = paidAgg[0]?.total ?? 0;
  const lastMonth = lastMonthRevenue[0]?.total ?? 0;

  return {
    totalCustomers: customerCount[0]?.value ?? 0,
    newEnquiries: enquiryCount[0]?.value ?? 0,
    pendingQuotations: Number(pendingQuote[0]?.value ?? 0),
    pendingQuotationsValue: Number(pendingQuote[0]?.total ?? 0),
    acceptedQuotations: Number(acceptedQuote[0]?.value ?? 0),
    acceptedQuotationsValue: Number(acceptedQuote[0]?.total ?? 0),
    unpaidInvoices: Number(unpaid.value ?? 0),
    outstandingPence: outstanding,
    overdueInvoices: Number(paymentMethods[0]?.overdue ?? 0),
    monthlyRevenue: paid,
    lastMonthRevenue: lastMonth,
    totalRevenue: Number(paidAgg[0]?.total ?? paid),
    todaysJobs,
    recentQuotations,
    recentInvoices,
    revenueSeries: series,
    quoteStatusCounts: quoteStatusRows.map((row) => ({
      status: row.status,
      count: Number(row.value),
      total: Number(row.total),
    })),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function listCustomers(
  businessId: string,
  options: { search?: string; status?: string } = {},
) {
  const filters = [eq(customers.businessId, businessId)];
  if (options.search) {
    const term = `%${options.search.toLowerCase()}%`;
    filters.push(
      or(
        sql`lower(${customers.name}) like ${term}`,
        sql`lower(${customers.email}) like ${term}`,
        sql`lower(${customers.phone}) like ${term}`,
        sql`lower(${customers.address}) like ${term}`,
      )!,
    );
  }
  if (options.status === "lead" || options.status === "active") {
    filters.push(eq(customers.status, options.status));
  }

  return db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      address: customers.address,
      status: customers.status,
      notes: customers.notes,
      createdAt: customers.createdAt,
      quoteCount: sql<number>`(select count(*) from ${quotations} q where q.customer_id = ${customers.id})::int`,
      invoiceCount: sql<number>`(select count(*) from ${invoices} i where i.customer_id = ${customers.id})::int`,
      outstanding: sql<number>`(select coalesce(sum(i.total_pence - i.amount_paid_pence), 0) from ${invoices} i where i.customer_id = ${customers.id} and i.status = 'unpaid')::int`,
    })
    .from(customers)
    .where(and(...filters))
    .orderBy(asc(customers.name));
}

export type CustomerRow = Awaited<ReturnType<typeof listCustomers>>[number];

export async function getCustomerDetail(businessId: string, customerId: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.businessId, businessId), eq(customers.id, customerId)))
    .limit(1);
  if (!customer) return null;

  const [quoteRows, invoiceRows, jobRows, noteRows] = await Promise.all([
    db
      .select({
        id: quotations.id,
        number: quotations.number,
        title: quotations.title,
        status: quotations.status,
        totalPence: quotations.totalPence,
        issueDate: quotations.issueDate,
        shareToken: quotations.shareToken,
      })
      .from(quotations)
      .where(and(eq(quotations.businessId, businessId), eq(quotations.customerId, customerId)))
      .orderBy(desc(quotations.createdAt)),
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        title: invoices.title,
        status: invoices.status,
        totalPence: invoices.totalPence,
        amountPaidPence: invoices.amountPaidPence,
        dueDate: invoices.dueDate,
        shareToken: invoices.shareToken,
      })
      .from(invoices)
      .where(and(eq(invoices.businessId, businessId), eq(invoices.customerId, customerId)))
      .orderBy(desc(invoices.createdAt)),
    db
      .select()
      .from(jobs)
      .where(and(eq(jobs.businessId, businessId), eq(jobs.customerId, customerId)))
      .orderBy(desc(jobs.scheduledAt)),
    db
      .select()
      .from(customerNotes)
      .where(and(eq(customerNotes.businessId, businessId), eq(customerNotes.customerId, customerId)))
      .orderBy(desc(customerNotes.createdAt)),
  ]);

  return { customer, quotations: quoteRows, invoices: invoiceRows, jobs: jobRows, notes: noteRows };
}

export async function getQuotation(businessId: string, quotationId: string) {
  const [quote] = await db
    .select()
    .from(quotations)
    .where(and(eq(quotations.businessId, businessId), eq(quotations.id, quotationId)))
    .limit(1);
  if (!quote) return null;
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.businessId, businessId), eq(customers.id, quote.customerId)))
    .limit(1);
  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, quote.id))
    .orderBy(asc(quotationItems.position));
  const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  return { quote, customer, items, business: business[0] };
}

export async function getInvoice(businessId: string, invoiceId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.businessId, businessId), eq(invoices.id, invoiceId)))
    .limit(1);
  if (!invoice) return null;
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.businessId, businessId), eq(customers.id, invoice.customerId)))
    .limit(1);
  const [items, paymentRows, businessRows] = await Promise.all([
    db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id))
      .orderBy(asc(invoiceItems.position)),
    db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoice.id))
      .orderBy(desc(payments.paidAt)),
    db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1),
  ]);
  return { invoice, customer, items, payments: paymentRows, business: businessRows[0] };
}

export async function listQuotations(businessId: string, status?: string) {
  const filters = [eq(quotations.businessId, businessId)];
  if (status && ["draft", "sent", "accepted", "rejected"].includes(status)) {
    filters.push(eq(quotations.status, status as "draft" | "sent" | "accepted" | "rejected"));
  }
  return db
    .select({
      id: quotations.id,
      number: quotations.number,
      title: quotations.title,
      status: quotations.status,
      totalPence: quotations.totalPence,
      issueDate: quotations.issueDate,
      validUntil: quotations.validUntil,
      customerName: customers.name,
      customerId: customers.id,
      customerPhone: customers.phone,
      shareToken: quotations.shareToken,
    })
    .from(quotations)
    .innerJoin(customers, eq(customers.id, quotations.customerId))
    .where(and(...filters))
    .orderBy(desc(quotations.createdAt));
}

export async function listInvoices(businessId: string, status?: string) {
  const filters = [eq(invoices.businessId, businessId)];
  if (status === "paid") filters.push(eq(invoices.status, "paid"));
  if (status === "unpaid") filters.push(eq(invoices.status, "unpaid"));
  if (status === "overdue") {
    filters.push(
      and(
        eq(invoices.status, "unpaid"),
        lt(invoices.dueDate, sql`current_date`),
        lt(invoices.amountPaidPence, invoices.totalPence),
      )!,
    );
  }
  return db
    .select({
      id: invoices.id,
      number: invoices.number,
      title: invoices.title,
      status: invoices.status,
      totalPence: invoices.totalPence,
      amountPaidPence: invoices.amountPaidPence,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      customerName: customers.name,
      customerId: customers.id,
      customerPhone: customers.phone,
      shareToken: invoices.shareToken,
    })
    .from(invoices)
    .innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(and(...filters))
    .orderBy(desc(invoices.createdAt));
}

export async function listJobs(businessId: string) {
  return db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      status: jobs.status,
      scheduledAt: jobs.scheduledAt,
      durationMinutes: jobs.durationMinutes,
      address: jobs.address,
      assignedTo: jobs.assignedTo,
      customerId: jobs.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(jobs)
    .innerJoin(customers, eq(customers.id, jobs.customerId))
    .where(eq(jobs.businessId, businessId))
    .orderBy(asc(jobs.scheduledAt));
}

export async function getCustomerOptions(businessId: string) {
  return db
    .select({ id: customers.id, name: customers.name, phone: customers.phone, address: customers.address })
    .from(customers)
    .where(eq(customers.businessId, businessId))
    .orderBy(asc(customers.name));
}

export async function getBusinessUsage(businessId: string) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [customerCount, quoteCount, staffCount] = await Promise.all([
    db.select({ value: count() }).from(customers).where(eq(customers.businessId, businessId)),
    db
      .select({ value: count() })
      .from(quotations)
      .where(and(eq(quotations.businessId, businessId), gte(quotations.createdAt, monthStart))),
    db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.businessId, businessId), eq(users.role, "staff"), eq(users.isActive, true))),
  ]);
  return {
    customers: Number(customerCount[0]?.value ?? 0),
    quotationsThisMonth: Number(quoteCount[0]?.value ?? 0),
    staff: Number(staffCount[0]?.value ?? 0),
  };
}

export async function listStaff(businessId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.businessId, businessId))
    .orderBy(asc(users.createdAt));
}

export async function getPublicQuotation(token: string) {
  const [row] = await db
    .select({ quote: quotations, customer: customers, business: businesses })
    .from(quotations)
    .innerJoin(customers, eq(customers.id, quotations.customerId))
    .innerJoin(businesses, eq(businesses.id, quotations.businessId))
    .where(eq(quotations.shareToken, token))
    .limit(1);
  if (!row) return null;
  const items = await db
    .select()
    .from(quotationItems)
    .where(eq(quotationItems.quotationId, row.quote.id))
    .orderBy(asc(quotationItems.position));
  return { ...row, items };
}

export async function getWhatsAppQueue(businessId: string) {
  const [pendingQuotes, unpaidInvoices, upcomingJobs] = await Promise.all([
    db
      .select({
        id: quotations.id,
        number: quotations.number,
        title: quotations.title,
        totalPence: quotations.totalPence,
        issueDate: quotations.issueDate,
        status: quotations.status,
        shareToken: quotations.shareToken,
        customerId: customers.id,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(quotations)
      .innerJoin(customers, eq(customers.id, quotations.customerId))
      .where(and(eq(quotations.businessId, businessId), inArray(quotations.status, ["draft", "sent"])))
      .orderBy(desc(quotations.createdAt))
      .limit(10),
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        title: invoices.title,
        totalPence: invoices.totalPence,
        amountPaidPence: invoices.amountPaidPence,
        dueDate: invoices.dueDate,
        shareToken: invoices.shareToken,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(invoices)
      .innerJoin(customers, eq(customers.id, invoices.customerId))
      .where(and(eq(invoices.businessId, businessId), eq(invoices.status, "unpaid")))
      .orderBy(asc(invoices.dueDate))
      .limit(10),
    db
      .select({
        id: jobs.id,
        title: jobs.title,
        scheduledAt: jobs.scheduledAt,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(jobs)
      .innerJoin(customers, eq(customers.id, jobs.customerId))
      .where(
        and(
          eq(jobs.businessId, businessId),
          gte(jobs.scheduledAt, new Date()),
          lte(jobs.scheduledAt, new Date(Date.now() + 14 * 86_400_000)),
          ne(jobs.status, "completed"),
        ),
      )
      .orderBy(asc(jobs.scheduledAt))
      .limit(10),
  ]);
  return { pendingQuotes, unpaidInvoices, upcomingJobs };
}
