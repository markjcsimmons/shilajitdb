import type { Metadata } from "next";
import Link from "next/link";
import { DM_Sans, Playfair_Display, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { prisma } from "@/lib/db";
import "./globals.css";

const GA_ID = "G-RTE2LYJXYD";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", axes: ["opsz"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

// Force Node.js runtime for all routes — Prisma native engine requires it.
export const runtime = "nodejs";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  verification: {
    google: "cVpQJmYig61v16dA5AtEsJGAHMNmXRoxXz_b2y0fckk",
  },
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
  twitter: {
    card: "summary_large_image",
    title: "Shilajit Transparency Database",
    description:
      "200+ shilajit products graded on COA quality, lab credibility, heavy metal safety, and manufacturing transparency.",
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
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="min-h-dvh flex flex-col">
          {/* ── Header ── */}
          <header className="sticky top-0 z-30 border-b border-[#252A40] bg-[#080B14]/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4" style={{ height: 56 }}>
              {/* Wordmark */}
              <Link href="/" className="flex items-center select-none shrink-0">
                <span className="text-[15px] font-bold tracking-tight text-[#EEF0F8]">Shilajit</span>
                <span className="text-[15px] font-bold tracking-tight text-[#3D7AFF]">DB</span>
              </Link>
              <nav className="flex items-center gap-0.5 text-[13px] text-[#8892B8]">
                <Link href="/learn" className="rounded-md px-3 py-1.5 hover:bg-[#171C2E] hover:text-[#EEF0F8] transition-colors">
                  Learn
                </Link>
                <Link href="/updates" className="rounded-md px-3 py-1.5 hover:bg-[#171C2E] hover:text-[#EEF0F8] transition-colors">
                  Updates
                </Link>
                <Link href="/methodology" className="rounded-md px-3 py-1.5 hover:bg-[#171C2E] hover:text-[#EEF0F8] transition-colors">
                  Methodology
                </Link>
                <Link href="/about" className="hidden sm:block rounded-md px-3 py-1.5 hover:bg-[#171C2E] hover:text-[#EEF0F8] transition-colors">
                  About
                </Link>
              </nav>
            </div>
          </header>

          {/* ── Main ── */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>

          {/* ── Footer ── */}
          <footer className="border-t border-[#252A40] bg-[#080B14] mt-16">
            <div className="mx-auto max-w-6xl px-4 py-10">
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center mb-3">
                    <span className="text-sm font-bold text-[#EEF0F8]">Shilajit</span>
                    <span className="text-sm font-bold text-[#3D7AFF]">DB</span>
                  </div>
                  <p className="text-xs text-[#8892B8] leading-relaxed max-w-xs">
                    A neutral, evidence-based database of shilajit products graded on testing, transparency, and safety.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6E7A9A] mb-3">Database</p>
                  <ul className="space-y-2 text-sm text-[#8892B8]">
                    <li><Link href="/?coaStatus=PUBLIC" className="hover:text-[#EEF0F8] transition-colors">Public COA</Link></li>
                    <li><Link href="/?thirdPartyTested=true" className="hover:text-[#EEF0F8] transition-colors">Named lab tested</Link></li>
                    <li><Link href="/?qualityTier=ULTRA_PREMIUM" className="hover:text-[#EEF0F8] transition-colors">Ultra Premium</Link></li>
                    <li><Link href="/updates" className="hover:text-[#EEF0F8] transition-colors">Recent updates</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6E7A9A] mb-3">Learn</p>
                  <ul className="space-y-2 text-sm text-[#8892B8]">
                    <li><Link href="/learn/what-is-shilajit" className="hover:text-[#EEF0F8] transition-colors">What is shilajit?</Link></li>
                    <li><Link href="/learn/how-to-read-shilajit-coa" className="hover:text-[#EEF0F8] transition-colors">How to read a COA</Link></li>
                    <li><Link href="/learn/shilajit-heavy-metals" className="hover:text-[#EEF0F8] transition-colors">Heavy metals safety</Link></li>
                    <li><Link href="/learn/shilajit-forms-compared" className="hover:text-[#EEF0F8] transition-colors">Forms compared</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6E7A9A] mb-3">About</p>
                  <ul className="space-y-2 text-sm text-[#8892B8]">
                    <li><Link href="/methodology" className="hover:text-[#EEF0F8] transition-colors">Methodology</Link></li>
                    <li><Link href="/about" className="hover:text-[#EEF0F8] transition-colors">About</Link></li>
                    <li><Link href="/learn" className="hover:text-[#EEF0F8] transition-colors">Research guides</Link></li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 border-t border-[#252A40] pt-6 flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-[#6E7A9A]">&copy; 2026 ShilajitDB. Independent and unaffiliated with any shilajit brand.</span>
                <div className="flex items-center gap-4">
                  <Link href="/terms" className="text-xs text-[#6E7A9A] hover:text-[#8892B8] transition-colors">Terms of Use</Link>
                  <span className="font-mono text-[10px] text-[#4A5070] tracking-widest">Unbiased · Comprehensive · Free</span>
                </div>
              </div>
              {/* Honeypot — hidden from humans, visible to scrapers */}
              <a href="/honeypot" aria-hidden="true" tabIndex={-1} style={{ display: "none" }}>
                Data export
              </a>
            </div>
          </footer>
        </div>
        {/* Organization schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Shilajit Transparency Database",
              url: siteUrl,
              description:
                "A neutral, evidence-based database of shilajit supplement products graded on testing transparency, lab credibility, and manufacturing safety.",
              sameAs: [],
            }),
          }}
        />
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
