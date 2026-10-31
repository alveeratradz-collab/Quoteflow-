"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  ReceiptText,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { logoutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/quotations", label: "Quotations", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/jobs", label: "Jobs", icon: CalendarDays },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/billing", label: "Plan & billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

const BOTTOM_ITEMS = NAV_ITEMS.slice(0, 5);

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition ${
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] ${active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"}`}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-1.5 pt-1.5 pb-1.5">
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10.5px] font-semibold transition ${
                  active ? "text-brand-700" : "text-slate-500"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`flex h-8 w-10 items-center justify-center rounded-lg ${
                    active ? "bg-brand-50 text-brand-600" : "text-slate-500"
                  }`}
                >
                  <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileTopBar({
  businessName,
  planLabel,
  userName,
}: {
  businessName: string;
  planLabel: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <Logo href="/dashboard" subtitle={businessName} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
            aria-label="Open menu"
          >
            <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[84%] max-w-xs flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-[13px] font-extrabold text-slate-900">{userName}</p>
                <p className="text-[11px] text-slate-500">
                  {businessName} · <span className="font-semibold text-brand-600">{planLabel}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <SidebarNav />
            </div>
            <div className="border-t border-slate-100 p-3">
              <Link
                href="/billing"
                className="mb-2 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-[13px] font-semibold text-brand-800"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Upgrade your plan
              </Link>
              <form action={logoutAction}>
                <SubmitButton className="btn-secondary w-full" pendingLabel="Signing out…">
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function QuickActionMenu({ label = "Menu" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}
