import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getCustomerDetail } from "@/lib/queries";
import { deleteCustomerAction, convertEnquiryAction } from "@/app/actions/customers";
import { formatDate, formatDateTime, formatMoney } from "@/lib/money";
import { Alert, EmptyState, InfoRow, LinkButton, StatusBadge } from "@/components/ui";
import { CustomerForm, NoteForm } from "@/components/customer-forms";
import { Drawer, ConfirmSubmit } from "@/components/interactive";
import { CopyLinkButton, WhatsAppButton } from "@/components/share-actions";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { business } = await requireAuth();
  const { id } = await params;
  const query = await searchParams;
  const detail = await getCustomerDetail(business.id, id);
  if (!detail) notFound();

  const { customer, quotations, invoices, jobs, notes } = detail;
  const outstanding = invoices.reduce(
    (sum, invoice) => sum + Math.max(0, invoice.totalPence - invoice.amountPaidPence),
    0,
  );
  const paidTotal = invoices.reduce((sum, invoice) => sum + invoice.amountPaidPence, 0);
  const firstName = customer.name.split(" ")[0];
  const welcomeMessage = `Hello ${firstName}, it's ${business.name}. How can we help today?`;

  return (
    <div>
      <Link href="/customers" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to customers
      </Link>

      {query.created ? <div className="mb-4"><Alert tone="success">Customer added. Next step: create a quotation.</Alert></div> : null}

      <div className="card card-pad">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-[15px] font-extrabold text-brand-700">
              {customer.name
                .split(" ")
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[21px] leading-tight font-extrabold tracking-tight text-slate-900">{customer.name}</h1>
                <StatusBadge status={customer.status} kind="customer" />
              </div>
              <p className="mt-0.5 text-[12.5px] text-slate-500">
                Customer since {formatDate(customer.createdAt)} · {quotations.length} quotes · {invoices.length} invoices
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WhatsAppButton
              phone={customer.phone}
              message={welcomeMessage}
              label="WhatsApp"
              className="btn-secondary"
            />
            <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className="btn-secondary">
              <Phone className="h-4 w-4" aria-hidden="true" /> Call
            </a>
            <Drawer
              triggerLabel="Edit"
              triggerIcon={<Pencil className="h-4 w-4" aria-hidden="true" />}
              triggerClassName="btn-secondary"
              title="Edit customer"
              description="Update contact details or notes."
            >
              <CustomerForm customer={customer} />
            </Drawer>
            <Drawer
              triggerLabel="Delete"
              triggerIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
              triggerClassName="btn-danger"
              title="Delete customer"
              description="This removes their quotes and invoices too. This cannot be undone."
            >
              <div className="space-y-4">
                <Alert tone="warning">
                  Deleting <strong>{customer.name}</strong> will permanently remove {quotations.length} quotations,{" "}
                  {invoices.length} invoices and {jobs.length} jobs linked to them.
                </Alert>
                <form action={deleteCustomerAction}>
                  <input type="hidden" name="id" value={customer.id} />
                  <ConfirmSubmit message={`Delete ${customer.name} and all their records?`} className="btn-danger w-full py-3">
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Yes, delete permanently
                  </ConfirmSubmit>
                </form>
              </div>
            </Drawer>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <ContactTile icon={<Phone className="h-4 w-4" />} label="Phone" value={customer.phone} href={`tel:${customer.phone.replace(/\s/g, "")}`} />
          <ContactTile icon={<Mail className="h-4 w-4" />} label="Email" value={customer.email || "Not provided"} href={customer.email ? `mailto:${customer.email}` : undefined} />
          <ContactTile icon={<MapPin className="h-4 w-4" />} label="Address" value={customer.address || "Not provided"} />
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-[10.5px] font-bold tracking-wide text-slate-400 uppercase">Outstanding</p>
            <p className={`mt-1 text-[15px] font-extrabold ${outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {formatMoney(outstanding)}
            </p>
            <p className="text-[11px] text-slate-500">{formatMoney(paidTotal)} paid to date</p>
          </div>
        </div>

        {customer.status === "lead" ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <p className="text-[12.5px] font-medium text-amber-800">
              This is still an enquiry. Convert them once the job is agreed.
            </p>
            <form action={convertEnquiryAction}>
              <input type="hidden" name="id" value={customer.id} />
              <button type="submit" className="btn-secondary py-1.5 text-[12px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Convert to customer
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="card">
            <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
              <h2 className="text-[15px] font-bold text-slate-900">Quotations</h2>
              <LinkButton href={`/quotations/new?customerId=${customer.id}`} variant="secondary" className="py-1.5 text-[12px]">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New quote
              </LinkButton>
            </header>
            {quotations.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-5 w-5" aria-hidden="true" />}
                title="No quotations yet"
                description="Create a professional quote for this customer in under a minute."
                action={
                  <LinkButton href={`/quotations/new?customerId=${customer.id}`}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Create quotation
                  </LinkButton>
                }
              />
            ) : (
              <ul className="divide-row">
                {quotations.map((quote) => (
                  <li key={quote.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/quotations/${quote.id}`} className="truncate text-[13.5px] font-semibold text-slate-800 hover:text-brand-700">
                        {quote.title}
                      </Link>
                      <p className="text-[11.5px] text-slate-500">
                        {quote.number} · {formatDate(quote.issueDate)}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold text-slate-800">{formatMoney(quote.totalPence)}</span>
                    <StatusBadge status={quote.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
              <h2 className="text-[15px] font-bold text-slate-900">Invoices</h2>
              <LinkButton href={`/invoices/new?customerId=${customer.id}`} variant="secondary" className="py-1.5 text-[12px]">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New invoice
              </LinkButton>
            </header>
            {invoices.length === 0 ? (
              <EmptyState
                icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
                title="No invoices yet"
                description="When a quote is accepted, convert it into an invoice with one tap."
              />
            ) : (
              <ul className="divide-row">
                {invoices.map((invoice) => {
                  const due = invoice.totalPence - invoice.amountPaidPence;
                  return (
                    <li key={invoice.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <Link href={`/invoices/${invoice.id}`} className="truncate text-[13.5px] font-semibold text-slate-800 hover:text-brand-700">
                          {invoice.number} · {invoice.title}
                        </Link>
                        <p className="text-[11.5px] text-slate-500">
                          Due {formatDate(invoice.dueDate)} · {formatMoney(invoice.amountPaidPence)} paid
                        </p>
                      </div>
                      <span className={`text-[13px] font-bold ${due > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {formatMoney(due)} {due > 0 ? "due" : "paid"}
                      </span>
                      <StatusBadge status={invoice.status} kind="invoice" />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card">
            <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5">
              <h2 className="text-[15px] font-bold text-slate-900">Jobs</h2>
              <LinkButton href={`/jobs?new=1&customerId=${customer.id}`} variant="secondary" className="py-1.5 text-[12px]">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Book job
              </LinkButton>
            </header>
            {jobs.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
                title="No jobs booked"
                description="Schedule the visit so it appears on your calendar."
              />
            ) : (
              <ul className="divide-row">
                {jobs.map((job) => (
                  <li key={job.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-slate-800">{job.title}</p>
                      <p className="text-[11.5px] text-slate-500">
                        {job.scheduledAt ? formatDateTime(job.scheduledAt) : "Not scheduled"} · {job.durationMinutes}min
                      </p>
                    </div>
                    <StatusBadge status={job.status} kind="job" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="card card-pad">
            <h2 className="mb-2 flex items-center gap-1.5 text-[15px] font-bold text-slate-900">
              <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" /> WhatsApp
            </h2>
            <p className="mb-3 text-[12px] text-slate-500">
              Tap a message — WhatsApp opens with the text ready to send.
            </p>
            <div className="space-y-2">
              <WhatsAppButton phone={customer.phone} message={welcomeMessage} label="Say hello" className="btn-secondary w-full justify-start text-[12.5px]" />
              <WhatsAppButton
                phone={customer.phone}
                message={`Hi ${firstName}, it's ${business.name}. Just following up — is there anything you need help with?`}
                label="Follow up"
                className="btn-secondary w-full justify-start text-[12.5px]"
              />
              <WhatsAppButton
                phone={customer.phone}
                message={`Thank you for choosing ${business.name}, ${firstName}! If you need anything else, just message us here.`}
                label="Thank you message"
                className="btn-secondary w-full justify-start text-[12.5px]"
              />
            </div>
            <div className="mt-2">
              <CopyLinkButton value={buildWhatsAppLink(customer.phone, welcomeMessage)} label="Copy WhatsApp link" className="btn-ghost w-full text-[12px]" />
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="mb-2 text-[15px] font-bold text-slate-900">Account summary</h2>
            <InfoRow label="Total quoted" value={formatMoney(quotations.reduce((s, q) => s + q.totalPence, 0))} />
            <InfoRow label="Accepted quotes" value={`${quotations.filter((q) => q.status === "accepted").length} of ${quotations.length}`} />
            <InfoRow label="Invoiced" value={formatMoney(invoices.reduce((s, i) => s + i.totalPence, 0))} />
            <InfoRow label="Paid" value={formatMoney(paidTotal)} />
            <InfoRow label="Outstanding" value={<span className={outstanding > 0 ? "text-rose-600" : "text-emerald-600"}>{formatMoney(outstanding)}</span>} />
            {customer.notes ? (
              <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-900">
                <p className="mb-1 flex items-center gap-1 text-[10.5px] font-bold tracking-wide uppercase">
                  <Wallet className="h-3.5 w-3.5" aria-hidden="true" /> Saved note
                </p>
                {customer.notes}
              </div>
            ) : null}
          </section>

          <section className="card card-pad">
            <h2 className="mb-2 text-[15px] font-bold text-slate-900">Notes</h2>
            <NoteForm customerId={customer.id} />
            {notes.length === 0 ? (
              <p className="mt-3 text-[12px] text-slate-500">No notes yet — add anything useful for next time.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {notes.map((note) => (
                  <li key={note.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-[12.5px] leading-relaxed text-slate-700">{note.body}</p>
                    <p className="mt-1.5 text-[10.5px] font-semibold text-slate-400">
                      {note.authorName || "You"} · {formatDate(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ContactTile({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide text-slate-400 uppercase">
        {icon} {label}
      </p>
      <p className="mt-1 truncate text-[13px] font-semibold text-slate-800">{value}</p>
    </>
  );
  return href ? (
    <a href={href} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 hover:border-brand-300 hover:bg-brand-50/50">
      {content}
    </a>
  ) : (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">{content}</div>
  );
}
