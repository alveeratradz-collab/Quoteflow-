import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "QuoteFlow — Business & Customer Manager",
    template: "%s · QuoteFlow",
  },
  description:
    "QuoteFlow helps plumbers, electricians, cleaners and other service businesses manage customers, quotations, invoices, jobs and WhatsApp follow-ups in one place.",
  applicationName: "QuoteFlow",
};

export const viewport: Viewport = {
  themeColor: "#1a5fe0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-dvh bg-[#f5f7fb] text-slate-900 antialiased">{children}</body>
    </html>
  );
}
