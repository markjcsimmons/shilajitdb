import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

// Force Node.js runtime for all routes — Prisma native engine requires it.
export const runtime = "nodejs";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shilajit Transparency Database",
    template: "%s | Shilajit Transparency Database",
  },
  description:
    "A neutral, evidence-based database of shilajit products sold in the United States. Search, filter, and compare objective transparency and quality signals.",
  openGraph: {
    type: "website",
    title: "Shilajit Transparency Database",
    description:
      "A neutral, evidence-based database of shilajit products sold in the United States.",
    url: siteUrl,
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Shilajit Transparency Database — fact-based product ratings",
      },
    ],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-dvh">
          <header className="border-b border-slate-200">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
              <div className="min-w-0">
                <Link
                  href="/"
                  className="truncate text-base font-semibold tracking-tight text-slate-900"
                >
                  Shilajit Transparency Database
                </Link>
                <p className="mt-1 hidden text-sm text-slate-600 sm:block">
                  Fact-based product transparency &amp; quality signals
                </p>
              </div>
              <nav className="flex items-center gap-3 text-sm text-slate-700">
                <Link href="/methodology" className="hover:text-slate-900">
                  Methodology
                </Link>
                <Link href="/admin" className="hover:text-slate-900">
                  Admin
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200">
            <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600">
              <p>
                Built to show sources and objective signals. See{" "}
                <Link href="/methodology" className="underline underline-offset-4">
                  methodology
                </Link>
                .
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

