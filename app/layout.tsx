import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import Script from "next/script";
import { prisma } from "@/lib/db";
import "./globals.css";

const GA_ID = "G-WMM7QDGCE7";

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
        <div className="min-h-dvh flex flex-col">
          {/* ── Header ── */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
              {/* Wordmark: "Shilajit" slate + "DB" amber */}
              <Link href="/" className="flex items-center gap-0 min-w-0 select-none">
                <span className="text-[15px] font-bold tracking-tight text-slate-900">Shilajit</span>
                <span className="text-[15px] font-black tracking-tight text-amber-500">DB</span>
              </Link>
              <nav className="flex items-center gap-0.5 text-[13px] text-slate-600">
                <Link href="/learn" className="rounded-md px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                  Learn
                </Link>
                <Link href="/updates" className="rounded-md px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                  Updates
                </Link>
                <Link href="/methodology" className="rounded-md px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                  Methodology
                </Link>
                <Link href="/about" className="hidden sm:block rounded-md px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                  About
                </Link>
              </nav>
            </div>
          </header>

          {/* ── Main ── */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>

          {/* ── Footer ── */}
          <footer className="border-t border-slate-200 bg-white mt-12">
            <div className="mx-auto max-w-6xl px-4 py-10">
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-0 mb-3">
                    <span className="text-sm font-bold tracking-tight text-slate-900">Shilajit</span>
                    <span className="text-sm font-black tracking-tight text-amber-500">DB</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                    A neutral, evidence-based database of shilajit products graded on testing, transparency, and safety.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Database</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li><Link href="/?coaStatus=PUBLIC" className="hover:text-slate-900 transition-colors">Public COA</Link></li>
                    <li><Link href="/?thirdPartyTested=true" className="hover:text-slate-900 transition-colors">Named lab tested</Link></li>
                    <li><Link href="/?qualityTier=ULTRA_PREMIUM" className="hover:text-slate-900 transition-colors">Ultra Premium</Link></li>
                    <li><Link href="/updates" className="hover:text-slate-900 transition-colors">Recent updates</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Learn</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li><Link href="/learn/what-is-shilajit" className="hover:text-slate-900 transition-colors">What is shilajit?</Link></li>
                    <li><Link href="/learn/how-to-read-shilajit-coa" className="hover:text-slate-900 transition-colors">How to read a COA</Link></li>
                    <li><Link href="/learn/shilajit-heavy-metals" className="hover:text-slate-900 transition-colors">Heavy metals safety</Link></li>
                    <li><Link href="/learn/shilajit-forms-compared" className="hover:text-slate-900 transition-colors">Forms compared</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">About</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li><Link href="/methodology" className="hover:text-slate-900 transition-colors">Methodology</Link></li>
                    <li><Link href="/about" className="hover:text-slate-900 transition-colors">About</Link></li>
                    <li><Link href="/learn" className="hover:text-slate-900 transition-colors">Research guides</Link></li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-400">
                Independent and unaffiliated with any shilajit brand.
              </div>
            </div>
          </footer>
        </div>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
