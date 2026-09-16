import Link from "next/link";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";
import { LEARN_ARTICLES } from "@/lib/learn-articles";

export const metadata: Metadata = {
  title: "Learn About Shilajit — Research, Guides & Buyer Education",
  description:
    "Evidence-based guides on shilajit: what it is, how to evaluate quality, how to read a COA, heavy metals safety, sourcing regions, and more.",
  alternates: { canonical: absoluteUrl("/learn") },
  openGraph: {
    title: "Learn About Shilajit — Research, Guides & Buyer Education",
    description:
      "Evidence-based guides on shilajit quality, sourcing, testing, and safety.",
    url: absoluteUrl("/learn"),
  },
};

const tagColors: Record<string, string> = {
  Foundation: "bg-[#052010] text-[#22C55E] border border-[#22C55E]/30",
  Sourcing: "bg-[#041828] text-[#38BDF8] border border-[#38BDF8]/30",
  "Buying Guide": "bg-[#160F28] text-[#A78BFA] border border-[#A78BFA]/30",
  Safety: "bg-[#200505] text-[#EF4444] border border-[#EF4444]/30",
  Science: "bg-[#051428] text-[#3B82F6] border border-[#3B82F6]/30",
  Practical: "bg-[#1F2540] text-[#8892B8] border border-[#252A40]",
  Testing: "bg-[#0A1628] text-[#6E9FFF] border border-[#3D7AFF]/30",
  Ingredients: "bg-[#0F1628] text-[#F59E0B] border border-[#F59E0B]/30",
};

export default function LearnIndexPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-[#252A40] bg-[#0F1320] p-6">
        <div className="flex items-center gap-2 text-xs text-[#4A5070] mb-3">
          <Link href="/" className="hover:text-[#8892B8] transition-colors">Home</Link>
          <span>/</span>
          <span>Learn</span>
        </div>
        <h1 className="font-serif text-2xl font-semibold text-[#EEF0F8]">
          Learn About Shilajit
        </h1>
        <p className="mt-2 text-sm text-[#8892B8] max-w-2xl">
          Evidence-based guides written for buyers — not brands. Each article references
          peer-reviewed research and links back to the database so you can act on what you learn.
        </p>
      </div>

      {/* Article grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LEARN_ARTICLES.map((a) => (
          <Link
            key={a.slug}
            href={`/learn/${a.slug}`}
            className="group rounded-lg border border-[#252A40] bg-[#0F1320] p-5 hover:bg-[#171C2E] hover:border-[#313760] transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tagColors[a.tag] ?? "bg-[#1F2540] text-[#8892B8]"}`}
              >
                {a.tag}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-[#EEF0F8] leading-snug">
              {a.title}
            </h2>
            <p className="mt-1.5 text-xs text-[#4A5070] leading-relaxed">{a.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-[#6E9FFF] group-hover:text-[#EEF0F8] transition-colors">
              Read →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
