"use client";

import { useState } from "react";
import { Check, Copy, Download, MessageCircle, Printer } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export function WhatsAppButton({
  phone,
  message,
  label = "Send on WhatsApp",
  className = "btn-primary",
}: {
  phone: string;
  message: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={buildWhatsAppLink(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}

export function CopyLinkButton({
  value,
  label = "Copy link",
  className = "btn-secondary",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("input");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function PrintButton({ className = "btn-secondary" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Printer className="h-4 w-4" aria-hidden="true" /> Print
    </button>
  );
}

export function DownloadPdfLink({ href, label = "Download PDF" }: { href: string; label?: string }) {
  return (
    <a href={href} className="btn-primary" download>
      <Download className="h-4 w-4" aria-hidden="true" /> {label}
    </a>
  );
}
