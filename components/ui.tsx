import Link from "next/link";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | undefined | null | false>) {
  return twMerge(clsx(inputs));
}

export function Badge({
  children,
  variant = "default",
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline" | "muted";
}) {
  const cls =
    variant === "outline"
      ? "border border-slate-200 bg-white text-slate-700"
      : variant === "muted"
        ? "bg-slate-100 text-slate-700"
        : "bg-slate-900 text-white";
  return (
    <span
      {...rest}
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs", cls, className)}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  href,
  type,
  variant = "primary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50";
  const cls =
    variant === "secondary"
      ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
      : variant === "ghost"
        ? "bg-transparent text-slate-900 hover:bg-slate-100"
        : "bg-slate-900 text-white hover:bg-slate-800";
  const finalClassName = cn(base, cls, className);

  if (href) {
    return (
      <Link href={href} className={finalClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type ?? "button"} className={finalClassName} {...rest}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20",
        props.className
      )}
    />
  );
}

