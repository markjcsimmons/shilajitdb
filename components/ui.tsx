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
      ? "border border-[#252A40] bg-transparent text-[#8892B8]"
      : variant === "muted"
        ? "bg-[#1F2540] text-[#8892B8]"
        : "bg-[#3D7AFF] text-[#080B14]";
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
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3D7AFF] disabled:opacity-50";
  const cls =
    variant === "secondary"
      ? "border border-[#252A40] bg-[#171C2E] text-[#8892B8] hover:border-[#313760] hover:text-[#EEF0F8]"
      : variant === "ghost"
        ? "bg-transparent text-[#8892B8] hover:bg-[#171C2E] hover:text-[#EEF0F8]"
        : "bg-[#3D7AFF] text-[#080B14] hover:bg-[#6E9FFF]";
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
        "h-10 w-full rounded-lg border border-[#252A40] bg-[#1F2540] px-3 text-sm text-[#EEF0F8] placeholder:text-[#4A5070] focus:outline-none focus:border-[#3D7AFF] focus:ring-1 focus:ring-[#3D7AFF]/30",
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
        "h-10 w-full rounded-lg border border-[#252A40] bg-[#1F2540] px-3 text-sm text-[#EEF0F8] focus:outline-none focus:border-[#3D7AFF] focus:ring-1 focus:ring-[#3D7AFF]/30",
        props.className
      )}
    />
  );
}

