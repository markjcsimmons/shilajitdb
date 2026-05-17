import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeDisplay(g: string | null) {
  if (!g) return null;
  return g.replace("_PLUS", "+");
}

function formLabel(form: string) {
  const map: Record<string, string> = {
    RESIN: "resin", CAPSULE: "capsules", POWDER: "powder", GUMMY: "gummies",
    TABLET: "tablets", TABLETS: "tablets", HONEY_STICKS: "honey sticks",
    LIQUID: "liquid drops", OTHER: "supplements", BLEND: "blend",
  };
  return map[form] ?? form.toLowerCase().replace(/_/g, " ");
}

function joinForms(forms: string[]) {
  const labels = [...new Set(forms)].map(formLabel);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function productNoun(forms: string[], count: number) {
  const unique = [...new Set(forms)];
  if (unique.length === 1) {
    const base = formLabel(unique[0]);
    return base === "resin" && count === 1 ? "resin" : base;
  }
  return count === 1 ? "product" : "products";
}

function buildGradeStr(grades: (string | null)[]) {
  const valid = grades.filter(Boolean).map(gradeDisplay) as string[];
  if (!valid.length) return null;
  const order = ["F", "E", "D", "C", "B", "A", "A+"];
  const sorted = [...new Set(valid)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return sorted.length === 1 ? sorted[0] : `${sorted[0]} to ${sorted[sorted.length - 1]}`;
}

function normaliseLabName(lab: string) {
  return lab.replace(/labaratories/gi, "Laboratories").replace(/labaratory/gi, "Laboratory").trim();
}

const COA_RANK: Record<string, number> = {
  PUBLIC: 4, PUBLIC_EMBEDDED: 3, REQUEST_ONLY: 2, UNKNOWN: 1, NONE: 0,
};

function buildDescription(brandName: string, products: {
  form: string;
  overallGrade: string | null;
  coaStatus: string;
  thirdPartyTestingLab: string | null;
  heavyMetalsTested: string | null;
}[]): string {
  const n = products.length;
  const forms = products.map(p => p.form);
  const displayForms = forms.filter(f => f !== "OTHER");
  const uniqueDisplayForms = [...new Set(displayForms)];
  const noun = productNoun(displayForms.length ? displayForms : forms, n);
  const multiForm = uniqueDisplayForms.length > 1;
  const formDetail = multiForm ? ` — ${joinForms(uniqueDisplayForms)}` : "";
  const gradeStr = buildGradeStr(products.map(p => p.overallGrade));
  const gradeClause = gradeStr ? `, graded ${gradeStr}` : "";
  const count = n === 1 ? "1" : `${n}`;
  const s1 = `${brandName} sells ${count} shilajit ${noun}${formDetail}${gradeClause}.`;

  const bestCoaStatus = products.reduce((best, p) =>
    (COA_RANK[p.coaStatus] ?? 0) > (COA_RANK[best] ?? 0) ? p.coaStatus : best, "NONE");

  const rawLab = products.find(p => p.thirdPartyTestingLab?.trim())?.thirdPartyTestingLab?.trim();
  const lab = rawLab ? normaliseLabName(rawLab) : undefined;
  const hasConfirmed = products.some(p => p.heavyMetalsTested === "CONFIRMED");
  const hasClaimed = products.some(p => p.heavyMetalsTested === "CLAIMED");

  let s2 = "";
  if (bestCoaStatus === "PUBLIC" || bestCoaStatus === "PUBLIC_EMBEDDED") {
    const labStr = lab ? `Tested by ${lab}` : "A public Certificate of Analysis is available";
    const hm = hasConfirmed ? " with confirmed heavy metal results" : hasClaimed ? "; heavy metals testing claimed" : "";
    s2 = `${labStr}${hm}.`;
  } else if (bestCoaStatus === "REQUEST_ONLY") {
    const hm = hasConfirmed || hasClaimed ? " Heavy metals testing claimed." : "";
    s2 = `A COA is available on request.${hm}`;
  } else {
    s2 = "No Certificate of Analysis is publicly available.";
  }

  const full = `${s1} ${s2}`.trim();
  if (full.length <= 155) return full;
  const trimmed = full.slice(0, 152);
  return trimmed.slice(0, trimmed.lastIndexOf(" ")) + "…";
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      products: {
        where: { isCanonical: true, dataCompleteness: { not: "LOW" } },
        select: {
          form: true,
          overallGrade: true,
          coaStatus: true,
          thirdPartyTestingLab: true,
          heavyMetalsTested: true,
        },
      },
    },
  });

  let updated = 0;
  let skipped = 0;
  const previews: { name: string; description: string }[] = [];

  for (const brand of brands) {
    if (brand.products.length === 0) { skipped++; continue; }
    const description = buildDescription(brand.name, brand.products);
    await prisma.brand.update({ where: { id: brand.id }, data: { description } });
    previews.push({ name: brand.name, description });
    updated++;
  }

  return NextResponse.json({ ok: true, updated, skipped, previews });
}
