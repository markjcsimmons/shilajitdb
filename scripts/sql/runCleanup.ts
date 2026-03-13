/**
 * runCleanup.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TypeScript replacement for cleanup_bad_run.sql — no psql needed.
 *
 * Removes junk Products:
 *   • "Unknown Brand Shilajit" old-style placeholders
 *   • "Unknown (domain.com)" new-style placeholders
 *   • Non-shilajit LOW-completeness products
 *
 * Safety:
 *   - PREVIEW mode by default. Add --confirm to actually delete.
 *   - NEVER deletes products with meaningful evidence (COA/MANUFACTURING/INGREDIENTS/TESTING
 *     from non-discovery sources).
 *   - Products with only discovery evidence (Sitemap, OCR, etc.): evidence is moved to
 *     quarantine first, then product is deleted.
 *   - Moves Listings to domain quarantine products where they exist.
 *
 * Run salvageCollapseUnknownPlaceholders.ts first for bulk collapse of Unknown Brand placeholders.
 *
 * Usage:
 *   npx tsx scripts/sql/runCleanup.ts              ← preview only
 *   npx tsx scripts/sql/runCleanup.ts --confirm    ← actually delete
 */

import "dotenv/config";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { extractDomain } from "@/lib/urlCanonicalize";

const DRY_RUN = !process.argv.includes("--confirm");
const SHILAJIT_TERMS = [
  "shilajit","shilajeet","mumio","mumijo","mineral-pitch",
  "mineral_pitch","fulvic","asphaltum","humic","live-resin",
];

const DISCOVERY_SOURCE_PATTERNS = [/sitemap/i, /ocr/i, /discovery/i, /meta/i, /harvest/i];
const MEANINGFUL_TYPES = ["COA", "MANUFACTURING", "INGREDIENTS", "TESTING"];

function isDiscoveryEvidence(sourceName: string | null): boolean {
  if (!sourceName) return false;
  return DISCOVERY_SOURCE_PATTERNS.some((p) => p.test(sourceName));
}

function hasMeaningfulEvidence(evidence: { type: string; sourceName: string | null }[]): boolean {
  return evidence.some(
    (e) =>
      MEANINGFUL_TYPES.includes(e.type) && !isDiscoveryEvidence(e.sourceName)
  );
}

function log(msg: string) { console.log(msg); }
function hr() { log("─".repeat(60)); }

async function collectJunkProductIds(): Promise<{ id: string; name: string; reason: string }[]> {
  const all = await prisma.product.findMany({
    where: {
      dataCompleteness: "LOW",
      sourceDsldLabelId: null,
    },
    select: {
      id: true,
      name: true,
      officialDomain: true,
      evidence: { select: { type: true, sourceName: true } },
    },
  });

  const results: { id: string; name: string; reason: string }[] = [];
  for (const p of all) {
    if (hasMeaningfulEvidence(p.evidence)) continue; // never delete

    let reason: string | null = null;

    if (p.name === "Unknown Brand Shilajit") {
      reason = "unknown-brand-shilajit";
    } else if (/^Unknown \(/i.test(p.name)) {
      reason = "unknown-domain-placeholder";
    } else if (!SHILAJIT_TERMS.some((t) => p.name.toLowerCase().includes(t))) {
      reason = "non-shilajit-sitemap-product";
    }

    if (reason) results.push({ id: p.id, name: p.name, reason });
  }
  return results;
}

async function main() {
  log("");
  log(DRY_RUN ? "=== CLEANUP — PREVIEW MODE (no changes) ===" : "=== CLEANUP — LIVE MODE ===");
  if (DRY_RUN) log("    Run with --confirm to actually delete.");
  hr();

  const junk = await collectJunkProductIds();

  if (junk.length === 0) {
    log("✓ No junk products found. Nothing to do.");
    return;
  }

  // Group by reason.
  const byReason = junk.reduce<Record<string, number>>((acc, j) => {
    acc[j.reason] = (acc[j.reason] ?? 0) + 1;
    return acc;
  }, {});

  log("Products targeted for deletion:");
  for (const [reason, count] of Object.entries(byReason)) {
    log(`  ${reason}: ${count}`);
  }
  log(`  TOTAL: ${junk.length}`);
  hr();

  const junkIds = junk.map((j) => j.id);

  // Count affected listings (fetch before any updates).
  const listings = await prisma.listing.findMany({
    where: { productId: { in: junkIds } },
    select: { id: true, url: true, productId: true },
  });
  log(`Listings on junk products: ${listings.length}`);

  // For each listing, check if a quarantine product exists for its domain.
  const quarantineMap = new Map<string, string>(); // listingId → quarantine productId
  const quarantineProductCache = new Map<string, string | null>(); // domain → productId|null

  for (const l of listings) {
    let domain: string | null = null;
    try {
      domain = extractDomain(l.url);
    } catch { /* ignore */ }

    if (!domain) continue;

    if (!quarantineProductCache.has(domain)) {
      const slug = `quarantine-${slugify(domain)}`;
      const qp = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
      quarantineProductCache.set(domain, qp?.id ?? null);
    }

    const quarantineId = quarantineProductCache.get(domain);
    if (quarantineId) quarantineMap.set(l.id, quarantineId);
  }

  const moveable = quarantineMap.size;
  const deletable = listings.length - moveable;
  log(`  → Will move to quarantine: ${moveable}`);
  log(`  → Will be deleted (no quarantine product): ${deletable}`);
  hr();

  if (DRY_RUN) {
    log("Preview complete. Re-run with --confirm to apply.");
    log("");
    if (junk.length <= 20) {
      log("Sample of products that would be deleted:");
      junk.slice(0, 20).forEach((j) => log(`  [${j.reason}] ${j.name}`));
    }
    return;
  }

  // ── LIVE: execute deletions ────────────────────────────────────────────────

  // Move listings to quarantine products.
  for (const [listingId, quarantineId] of quarantineMap) {
    await prisma.listing.update({
      where: { id: listingId },
      data: { productId: quarantineId },
    });
  }
  log(`✓ Moved ${quarantineMap.size} listings to quarantine products.`);

  // Delete remaining listings on junk products.
  const remainingListingIds = listings
    .filter((l) => !quarantineMap.has(l.id))
    .map((l) => l.id);
  if (remainingListingIds.length > 0) {
    await prisma.listing.deleteMany({ where: { id: { in: remainingListingIds } } });
    log(`✓ Deleted ${remainingListingIds.length} listings (no quarantine product for their domain).`);
  }

  // Delete MergeCandidates.
  const mcResult = await prisma.mergeCandidate.deleteMany({
    where: { candidateProductId: { in: junkIds } },
  });
  log(`✓ Deleted ${mcResult.count} MergeCandidate rows.`);

  // Move discovery evidence to quarantine before deleting products.
  const evidenceRows = await prisma.evidence.findMany({
    where: { productId: { in: junkIds } },
    select: { id: true, productId: true, type: true, sourceName: true, product: { select: { officialDomain: true } } },
  });
  let evidenceMoved = 0;
  for (const ev of evidenceRows) {
    if (!isDiscoveryEvidence(ev.sourceName)) continue;
    let domain = ev.product?.officialDomain ?? null;
    if (!domain && listings.some((l) => l.productId === ev.productId)) {
      const l = listings.find((l) => l.productId === ev.productId);
      try {
        domain = l ? extractDomain(l.url) : null;
      } catch { /* ignore */ }
    }
    if (!domain) continue;
    const slug = `quarantine-${slugify(domain)}`;
    let qp = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!qp) {
      let brand = await prisma.brand.findFirst({
        where: { OR: [{ websiteDomain: domain }, { slug: `domain-${slugify(domain)}` }] },
        select: { id: true },
      });
      if (!brand) {
        try {
          brand = await prisma.brand.create({
            data: {
              name: domain,
              slug: `domain-${slugify(domain)}`,
              websiteDomain: domain,
              website: `https://${domain}`,
            },
            select: { id: true },
          });
        } catch {
          brand = await prisma.brand.findFirst({
            where: { OR: [{ websiteDomain: domain }, { slug: `domain-${slugify(domain)}` }] },
            select: { id: true },
          });
        }
      }
      if (brand) {
        qp = await prisma.product.create({
          data: {
            brandId: brand.id,
            name: `Quarantine \u2013 ${domain}`,
            slug,
            form: "OTHER",
            ingredientText: "",
            ingredientsNormalized: [],
            manufacturingCountryClaim: null,
            manufacturingClaimText: null,
            manufacturingEvidenceUrl: null,
            coaStatus: "UNKNOWN",
            coaUrl: null,
            transparencyGrade: "F",
            qualityTier: "POOR",
            sourceDsldLabelId: null,
            sourceDsldUrl: null,
            dataCompleteness: "LOW",
            isCanonical: false,
            officialDomain: domain,
            lastVerifiedAt: null,
          },
          select: { id: true },
        });
      }
    }
    if (qp) {
      await prisma.evidence.update({
        where: { id: ev.id },
        data: { productId: qp.id },
      });
      evidenceMoved += 1;
    }
  }
  if (evidenceMoved > 0) log(`✓ Moved ${evidenceMoved} discovery evidence rows to quarantine.`);

  // Delete remaining evidence on junk products (meaningful evidence already excluded).
  const evResult = await prisma.evidence.deleteMany({
    where: { productId: { in: junkIds } },
  });
  log(`✓ Deleted ${evResult.count} remaining Evidence rows.`);

  // Delete the junk Products themselves.
  const prodResult = await prisma.product.deleteMany({
    where: { id: { in: junkIds } },
  });
  log(`✓ Deleted ${prodResult.count} junk Products.`);
  hr();
  log("Cleanup complete.");
  log("");
}

main()
  .catch((err) => {
    console.error("FATAL:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
