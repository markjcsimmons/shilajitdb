import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { gradeLabel } from "@/lib/grade-colors";
import { FORM_GRADE_CEILING, overallRubric } from "@/lib/grading";
import { LEARN_ARTICLES } from "@/lib/learn-articles";
import { coaLabel, formLabel } from "@/components/product-card";
import type { OverallGrade, ProductForm } from "@prisma/client";

// /llms.txt (https://llmstxt.org): a plain-markdown map of the site for AI assistants.
// Built from the live database, the grading constants and the learn-article registry so it
// can't drift from the pages it describes.
export const revalidate = 3600;

const BEST_PAGES: { tag: string; title: string }[] = [
  { tag: "editors-pick", title: "Editor's Picks" },
  { tag: "best-third-party-tested", title: "Best third-party tested shilajit" },
  { tag: "best-tested", title: "Best tested shilajit" },
  { tag: "best-resin", title: "Best shilajit resin" },
  { tag: "best-capsules", title: "Best shilajit capsules" },
  { tag: "best-gummies", title: "Best shilajit gummies" },
  { tag: "best-value", title: "Best value shilajit" },
  { tag: "best-for-men", title: "Best shilajit for men" },
  { tag: "best-for-women", title: "Best shilajit for women" },
  { tag: "best-himalayan-shilajit", title: "Best Himalayan shilajit" },
];

const link = (title: string, path: string, note?: string) =>
  `- [${title}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`;

function formCeilings(): string {
  const byGrade = new Map<string, string[]>();
  for (const [form, grade] of Object.entries(FORM_GRADE_CEILING)) {
    const forms = byGrade.get(grade) ?? [];
    forms.push(formLabel(form as ProductForm).toLowerCase());
    byGrade.set(grade, forms);
  }
  return [...byGrade].map(([grade, forms]) => `${forms.join(", ")} ${gradeLabel(grade as OverallGrade)}`).join("; ");
}

export async function GET() {
  const s = overallRubric.score;
  const where = { isCanonical: true, dataCompleteness: { not: "LOW" as const } };
  const [productCount, top] = await Promise.all([
    prisma.product.count({ where }), // same count as the homepage stat
    prisma.product.findMany({
      where: { ...where, overallGrade: { in: ["A_PLUS", "A"] } },
      orderBy: [{ overallGrade: "asc" }, { name: "asc" }],
      select: {
        slug: true,
        name: true,
        form: true,
        overallGrade: true,
        coaStatus: true,
        brand: { select: { name: true } },
        _count: { select: { evidence: true } },
      },
    }),
  ]);
  // Same indexability threshold as the product pages (fewer than 2 evidence sources → noindex).
  const topIndexed = top.filter((p) => p._count.evidence >= 2);

  const body = [
    "# ShilajitDB",
    "",
    `> ShilajitDB is a transparency database for shilajit supplements. It grades ${productCount} products from A+ to F on what their Certificates of Analysis (COAs) actually document: independent lab verification, numeric heavy metal results, lab disclosure, microbial testing, batch traceability and report recency. Every product is graded by the same published formula; there are no paid placements.`,
    "",
    "## How grading works",
    "",
    `- Overall grade is a ${overallRubric.maxScore}-point score: verified independent-lab COA +${s.coaVerifiedIndependent} (manufacturer-issued or unverifiable +${s.coaManufacturerIssued}); numeric heavy metals on the finished product +${s.heavyMetalsNumericFinished} (ingredient-only +${s.heavyMetalsNumericIngredient}, pass/fail only +${s.heavyMetalsPassFail}); lab named on the COA +${s.labNamedOnCoa}; microbial panel +${s.microbialPanel}; batch/lot code on the COA +${s.batchIdentified}; COA dated within 24 months +${s.coaRecent}; manufacturing country stated +${s.manufacturingCountry}; GMP certified +${s.gmpCertified}.`,
    "- Thresholds: A+ 13+, A 10+, B 7+, C 4+, D 2+, E 1, F 0.",
    `- Product form caps the grade because of processing and typical dose, not because absorption is proven lower: ${formCeilings()}.`,
    "- Fulvic acid percentage, patents and marketing claims are recorded but not scored.",
    "",
    "## Affiliate disclosure",
    "",
    "Some outbound purchase links (currently Pürblack) are affiliate links and are labelled as such on the page. Affiliate status has no input to grades or rankings.",
    "",
    "## Key pages",
    "",
    link("Shilajit comparison", "/shilajit-comparison", "top products ranked side by side by grade, form, COA status, heavy metals and price"),
    link("Scoring methodology", "/methodology", "full grading rubric, quality tiers and form ceilings"),
    link("Affiliate disclosure", "/disclosure"),
    link("About", "/about"),
    link("All products", "/", "searchable, filterable database"),
    "",
    "## Rankings",
    "",
    ...BEST_PAGES.map((p) => link(p.title, `/best/${p.tag}`)),
    "",
    "## Top-graded products (A+ and A)",
    "",
    ...topIndexed.map((p) =>
      link(
        p.name,
        `/product/${p.slug}`,
        `${p.brand.name} · grade ${gradeLabel(p.overallGrade)} · ${formLabel(p.form).toLowerCase()} · ${coaLabel(p.coaStatus)}`,
      ),
    ),
    "",
    "## Guides",
    "",
    ...LEARN_ARTICLES.map((a) => link(a.title, `/learn/${a.slug}`, a.description)),
    "",
    "## Optional",
    "",
    link("Sitemap", "/sitemap.xml", "every product, brand, lab-result and comparison page"),
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
