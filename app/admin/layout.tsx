import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Admin
          </div>
          <Link href="/admin" className="text-lg font-semibold tracking-tight text-slate-900">
            Shilajit Transparency Database
          </Link>
        </div>
        <Link href="/" className="text-sm text-slate-700 hover:text-slate-900">
          Public site
        </Link>
      </div>
      {children}
    </div>
  );
}

