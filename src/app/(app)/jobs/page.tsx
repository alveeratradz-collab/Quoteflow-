import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutList,
  MapPin,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getCustomerOptions, listJobs } from "@/lib/queries";
import { deleteJobAction } from "@/app/actions/jobs";
import { formatDateTime, relativeDay } from "@/lib/money";
import { Alert, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Drawer, ConfirmSubmit } from "@/components/interactive";
import { JobForm, JobStatusSelect } from "@/components/job-forms";
import { WhatsAppButton } from "@/components/share-actions";

export const metadata: Metadata = { title: "Jobs" };

function toLocalInput(value: Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function monthMatrix(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: Date | null; iso: string | null }[] = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push({ date: null, iso: null });
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ date, iso: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, iso: null });
  return cells;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; new?: string; customerId?: string; created?: string }>;
}) {
  const { business } = await requireAuth();
  const params = await searchParams;
  const [jobs, customers] = await Promise.all([listJobs(business.id), getCustomerOptions(business.id)]);
  const view = params.view === "calendar" ? "calendar" : "list";

  const monthDate = params.month ? new Date(`${params.month}-01T12:00:00`) : new Date();
  const safeMonth = Number.isNaN(monthDate.getTime()) ? new Date() : monthDate;
  const monthKey = `${safeMonth.getFullYear()}-${String(safeMonth.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthDate = new Date(safeMonth.getFullYear(), safeMonth.getMonth() - 1, 1);
  const nextMonthDate = new Date(safeMonth.getFullYear(), safeMonth.getMonth() + 1, 1);
  const monthParam = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const todayIso = new Date().toISOString().slice(0, 10);

  const jobsByDay = new Map<string, typeof jobs>();
  for (const job of jobs) {
    if (!job.scheduledAt) continue;
    const iso = new Date(job.scheduledAt).toISOString().slice(0, 10);
    const existing = jobsByDay.get(iso) ?? [];
    existing.push(job);
    jobsByDay.set(iso, existing);
  }

  const upcoming = jobs.filter((job) => job.status !== "completed" && job.status !== "cancelled");
  const grouped = new Map<string, typeof jobs>();
  for (const job of upcoming) {
    const key = job.scheduledAt ? new Date(job.scheduledAt).toISOString().slice(0, 10) : "unscheduled";
    const existing = grouped.get(key) ?? [];
    existing.push(job);
    grouped.set(key, existing);
  }
  const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => {
    if (a === "unscheduled") return 1;
    if (b === "unscheduled") return -1;
    return a.localeCompare(b);
  });

  return (
    <div>
      <PageHeader
        eyebrow="Schedule"
        title="Jobs"
        description="Book appointments, assign your crew and keep the calendar moving."
        action={
          <Drawer
            triggerLabel="New job"
            triggerIcon={<CalendarPlus className="h-4 w-4" aria-hidden="true" />}
            title="Book a job"
            description="Pick the customer and appointment time."
            defaultOpen={params.new === "1"}
          >
            {customers.length === 0 ? (
              <Alert tone="warning">Add a customer before booking a job.</Alert>
            ) : (
              <JobForm customers={customers} defaultCustomerId={params.customerId} />
            )}
          </Drawer>
        }
      />

      {params.created ? <div className="mb-4"><Alert tone="success">Job added to the schedule.</Alert></div> : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Link href="/jobs" className={`chip ${view === "list" ? "chip-active" : ""}`}>
            <LayoutList className="h-3.5 w-3.5" aria-hidden="true" /> List
          </Link>
          <Link href={`/jobs?view=calendar&month=${monthKey}`} className={`chip ${view === "calendar" ? "chip-active" : ""}`}>
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Calendar
          </Link>
        </div>
        <p className="text-[12px] font-semibold text-slate-500">
          {upcoming.length} upcoming · {jobs.filter((job) => job.status === "completed").length} completed
        </p>
      </div>

      {view === "calendar" ? (
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <Link href={`/jobs?view=calendar&month=${monthParam(prevMonthDate)}`} className="btn-secondary px-2 py-1.5" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <h2 className="text-[15px] font-extrabold text-slate-900">
              {safeMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </h2>
            <Link href={`/jobs?view=calendar&month=${monthParam(nextMonthDate)}`} className="btn-secondary px-2 py-1.5" aria-label="Next month">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </header>
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day} className="py-2 text-[10.5px] font-bold tracking-wide text-slate-400 uppercase">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthMatrix(safeMonth).map((cell, index) => {
              const dayJobs = cell.iso ? jobsByDay.get(cell.iso) ?? [] : [];
              const isToday = cell.iso === todayIso;
              return (
                <div
                  key={`${cell.iso ?? "blank"}-${index}`}
                  className={`min-h-[68px] border-r border-b border-slate-100 p-1.5 last:border-r-0 sm:min-h-[92px] ${
                    cell.date ? "bg-white" : "bg-slate-50/40"
                  }`}
                >
                  {cell.date ? (
                    <>
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                          isToday ? "bg-brand-600 text-white" : "text-slate-500"
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayJobs.slice(0, 2).map((job) => (
                          <p
                            key={job.id}
                            className="truncate rounded bg-brand-50 px-1 py-0.5 text-[9.5px] font-semibold text-brand-800"
                            title={`${job.title} · ${job.customerName}`}
                          >
                            {job.scheduledAt ? new Date(job.scheduledAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}{" "}
                            {job.title}
                          </p>
                        ))}
                        {dayJobs.length > 2 ? (
                          <p className="text-[9px] font-semibold text-slate-400">+{dayJobs.length - 2} more</p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : upcoming.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
            title="No jobs scheduled"
            description="Book your first appointment and it will show up on your calendar and dashboard."
            action={
              customers.length > 0 ? (
                <Drawer
                  triggerLabel="Book a job"
                  triggerIcon={<CalendarPlus className="h-4 w-4" aria-hidden="true" />}
                  title="Book a job"
                >
                  <JobForm customers={customers} />
                </Drawer>
              ) : (
                <Link href="/customers?new=1" className="btn-primary">Add a customer first</Link>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map(([day, dayJobs]) => (
            <section key={day}>
              <h2 className="mb-2 px-1 text-[12px] font-bold tracking-wide text-slate-500 uppercase">
                {day === "unscheduled" ? "Unscheduled" : relativeDay(day)}
                <span className="ml-1.5 font-medium normal-case text-slate-400">
                  {day !== "unscheduled" ? `· ${new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
                </span>
              </h2>
              <ul className="card divide-row overflow-hidden">
                {dayJobs.map((job) => {
                  const confirmMessage = `Hi ${job.customerName.split(" ")[0]}, your job with ${business.name} is booked${
                    job.scheduledAt ? ` for ${formatDateTime(job.scheduledAt)}` : ""
                  }. We'll message you when we're on the way. Thank you!`;
                  return (
                    <li key={job.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] font-bold text-slate-900">{job.title}</p>
                            <StatusBadge status={job.status} kind="job" />
                          </div>
                          <p className="mt-0.5 text-[12px] text-slate-500">
                            {job.customerName} · {job.scheduledAt ? formatDateTime(job.scheduledAt) : "No time set"} ·{" "}
                            {job.durationMinutes} min
                            {job.assignedTo ? ` · ${job.assignedTo}` : ""}
                          </p>
                          {job.address ? (
                            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-400">
                              <MapPin className="h-3 w-3" aria-hidden="true" /> {job.address}
                            </p>
                          ) : null}
                          {job.description ? (
                            <p className="mt-1 line-clamp-2 text-[12px] text-slate-500">{job.description}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <JobStatusSelect jobId={job.id} status={job.status} />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <WhatsAppButton
                          phone={job.customerPhone}
                          message={confirmMessage}
                          label="Confirm"
                          className="btn-ghost px-2 py-1 text-[11.5px] text-emerald-700"
                        />
                        <Drawer
                          triggerLabel="Edit"
                          triggerIcon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
                          triggerClassName="btn-ghost px-2 py-1 text-[11.5px]"
                          title="Edit job"
                          description={`${job.customerName} · ${job.title}`}
                        >
                          <JobForm
                            customers={customers}
                            initialValues={{
                              id: job.id,
                              customerId: job.customerId,
                              title: job.title,
                              description: job.description,
                              status: job.status,
                              scheduledAt: job.scheduledAt ? toLocalInput(new Date(job.scheduledAt)) : "",
                              durationMinutes: job.durationMinutes,
                              address: job.address,
                              assignedTo: job.assignedTo,
                            }}
                          />
                        </Drawer>
                        <form action={deleteJobAction}>
                          <input type="hidden" name="id" value={job.id} />
                          <ConfirmSubmit
                            message={`Delete "${job.title}"?`}
                            className="btn-ghost px-2 py-1 text-[11.5px] text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                          </ConfirmSubmit>
                        </form>
                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" aria-hidden="true" /> {job.durationMinutes} min
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <Link href="/jobs?view=calendar" className="btn-secondary w-full">
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> See calendar view
          </Link>
        </div>
      )}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-slate-400">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Confirm appointments with one-tap WhatsApp messages
      </p>
    </div>
  );
}
