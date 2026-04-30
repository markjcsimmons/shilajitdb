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
    <div className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm min-h-[calc(100vh-80px)]">
      {/* Admin header bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 rounded-t-xl">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Admin
          </div>
          <Link href="/admin" className="text-base font-semibold tracking-tight text-slate-900 hover:text-slate-700 transition-colors">
            Shilajit Transparency Database
          </Link>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300 transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 8l6-6 6 6M4 6v8h3v-4h2v4h3V6" />
          </svg>
          Public site
        </Link>
      </div>
      {/* Page content */}
      <div className="px-6 py-6">
        {children}
      </div>
    </div>
  );
}
