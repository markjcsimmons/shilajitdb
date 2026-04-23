import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { prisma } from "@/lib/db";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

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
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const productCount = await prisma.product.count({
    where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
  });

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="min-h-dvh">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
              <div className="min-w-0">
                <Link
                  href="/"
                  className="truncate text-base font-semibold tracking-tight text-slate-900"
                >
                  Shilajit Transparency Database
                </Link>
                <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">
                  {productCount} products independently graded on quality, testing, and transparency.
                </p>
              </div>
              <nav className="flex items-center gap-3 text-sm text-slate-700">
                <Link href="/learn" className="hover:text-slate-900">
                  Learn
                </Link>
                <Link href="/updates" className="hover:text-slate-900">
                  Updates
                </Link>
                <Link href="/methodology" className="hover:text-slate-900">
                  Methodology
                </Link>
                <Link href="/about" className="hover:text-slate-900">
                  About
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
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

