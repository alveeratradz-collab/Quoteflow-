import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone, Plus, Search, UserPlus, Users } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { listCustomers } from "@/lib/queries";
import { formatMoney, formatDate } from "@/lib/money";
import { Alert, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { CustomerForm } from "@/components/customer-forms";
import { Drawer, SearchBar } from "@/components/interactive";
import { WhatsAppButton } from "@/components/share-actions";

export const metadata: Metadata = { title: "Customers" };

const FILTERS = [
  { key: "", label: "All customers" },
  { key: "lead", label: "Enquiries" },
  { key: "active", label: "Active" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; new?: string; deleted?: string; converted?: string }>;
}) {
  const { business } = await requireAuth();
  const params = await searchParams;
  const rows = await listCustomers(business.id, { search: params.q, status: params.status });
  const activeFilter = params.status ?? "";
  const isFiltered = Boolean(params.q || params.status);

  return (
    <div>
      <PageHeader
        eyebrow="Customer manager"
        title="Customers"
        description="Every customer, contact detail and balance in one place."
        action={
          <Drawer
            triggerLabel="Add customer"
            triggerIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            title="Add a customer"
            description="Just the basics — you can add more detail later."
            defaultOpen={params.new === "1"}
          >
            <CustomerForm />
          </Drawer>
        }
      />

      {params.deleted ? <div className="mb-4"><Alert tone="success">Customer deleted.</Alert></div> : null}
      {params.converted ? <div className="mb-4"><Alert tone="success">Enquiry converted to an active customer.</Alert></div> : null}

      <div className="card card-pad mb-4">
        <SearchBar
          action="/customers"
          placeholder="Search name, phone, email or address"
          defaultValue={params.q}
          hiddenFields={params.status ? { status: params.status } : undefined}
        />
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {FILTERS.map((filter) => {
            const query = new URLSearchParams();
            if (params.q) query.set("q", params.q);
            if (filter.key) query.set("status", filter.key);
            const href = query.toString() ? `/customers?${query.toString()}` : "/customers";
            const active = activeFilter === filter.key;
            return (
              <Link key={filter.key || "all"} href={href} className={`chip shrink-0 ${active ? "chip-active" : ""}`}>
                {filter.label}
              </Link>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={isFiltered ? <Search className="h-5 w-5" aria-hidden="true" /> : <Users className="h-5 w-5" aria-hidden="true" />}
            title={isFiltered ? "No customers match that search" : "No customers yet"}
            description={
              isFiltered
                ? "Try a different name, phone number or clear the filters."
                : "Add your first customer and you can quote them in seconds."
            }
            action={
              isFiltered ? (
                <Link href="/customers" className="btn-secondary">Clear filters</Link>
              ) : (
                <Drawer
                  triggerLabel="Add your first customer"
                  triggerIcon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
                  title="Add a customer"
                  description="Capture the details once — quote and invoice from them forever."
                  defaultOpen
                >
                  <CustomerForm />
                </Drawer>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[12px] font-semibold text-slate-500">
              {rows.length} {rows.length === 1 ? "customer" : "customers"}
              {isFiltered ? " matching" : ""}
            </p>
            {isFiltered ? (
              <Link href="/customers" className="text-[12px] font-bold text-brand-600">
                Clear filters
              </Link>
            ) : null}
          </div>
          <ul className="card divide-row overflow-hidden">
            {rows.map((customer) => (
              <li key={customer.id} className="group relative">
                <Link href={`/customers/${customer.id}`} className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50/70">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[12px] font-bold text-brand-700">
                    {initials(customer.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[14px] font-bold text-slate-900">{customer.name}</p>
                      <StatusBadge status={customer.status} kind="customer" />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {customer.phone}
                      </span>
                      {customer.email ? (
                        <span className="inline-flex max-w-[200px] items-center gap-1 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {customer.email}
                        </span>
                      ) : null}
                      {customer.address ? (
                        <span className="hidden items-center gap-1 sm:inline-flex">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {customer.address.split(",")[0]}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11.5px] text-slate-400">
                      {customer.quoteCount} quotes · {customer.invoiceCount} invoices · added {formatDate(customer.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {customer.outstanding > 0 ? (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-rose-700">
                        {formatMoney(customer.outstanding)} owed
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                        Settled
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-500" aria-hidden="true" />
                  </div>
                </Link>
                <div className="absolute top-1/2 right-12 hidden -translate-y-1/2 xl:block">
                  <div className="opacity-0 transition group-hover:opacity-100">
                    <WhatsAppButton
                      phone={customer.phone}
                      message={`Hello ${customer.name.split(" ")[0]}, it's ${business.name}. `}
                      label=""
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
