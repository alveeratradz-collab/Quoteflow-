"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";

export function Drawer({
  triggerLabel,
  triggerClassName = "btn-primary",
  triggerIcon,
  title,
  description,
  children,
  defaultOpen = false,
  wide = false,
}: {
  triggerLabel: ReactNode;
  triggerClassName?: string;
  triggerIcon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerIcon}
        {triggerLabel}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${
              wide ? "sm:max-w-3xl" : "sm:max-w-lg"
            }`}
          >
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900">{title}</h2>
                {description ? <p className="mt-0.5 text-[12.5px] text-slate-500">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-4">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ConfirmSubmit({
  children,
  message,
  className = "btn-danger",
}: {
  children: ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function SearchBar({
  action,
  placeholder,
  defaultValue,
  hiddenFields,
}: {
  action: string;
  placeholder: string;
  defaultValue?: string;
  hiddenFields?: Record<string, string>;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [pending, setPending] = useState(false);

  return (
    <form
      action={action}
      method="get"
      className="relative"
      onSubmit={() => {
        setPending(true);
        setTimeout(() => setPending(false), 1200);
      }}
    >
      {Object.entries(hiddenFields ?? {}).map(([key, val]) => (
        <input key={key} type="hidden" name={key} value={val} />
      ))}
      <svg
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="input pl-9"
        aria-label={placeholder}
      />
      {value ? (
        <button
          type="submit"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11px] font-bold text-white"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : "Search"}
        </button>
      ) : null}
    </form>
  );
}
