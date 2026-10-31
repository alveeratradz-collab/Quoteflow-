import Link from "next/link";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`${className} relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white shadow-[0_8px_18px_-10px_rgba(26,95,224,0.9)]`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]">
        <path
          d="M13.4 2.5 5.8 13.1c-.4.6 0 1.4.7 1.4h4.2l-1.3 6.8c-.1.8.9 1.2 1.4.6l7.6-10.6c.4-.6 0-1.4-.7-1.4h-4.2l1.3-6.8c.1-.8-.9-1.2-1.4-.6Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  className = "",
  subtitle,
}: {
  href?: string;
  className?: string;
  subtitle?: string;
}) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="leading-tight">
        <span className="block text-[17px] font-extrabold tracking-tight text-slate-900">
          Quote<span className="text-brand-600">Flow</span>
        </span>
        {subtitle ? (
          <span className="block text-[11px] font-medium tracking-wide text-slate-500">{subtitle}</span>
        ) : null}
      </span>
    </Link>
  );
}
