/**
 * salvageCollapseUnknownPlaceholders.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script to collapse 6,436+ Unknown Brand placeholder Products into
 * per-domain quarantine Products, preserving Listings + Evidence.
 *
 * Definitions:
 *   - "Unknown placeholder" = Product where (brand.name="Unknown Brand" OR
 *     product.name starts with "Unknown" OR brand.slug starts with "domain-")
 *     AND product.name is NOT a quarantine name
 *     AND dataCompleteness='LOW' AND sourceDsldLabelId IS NULL
 *
 *   - "Discovery evidence" = Evidence where sourceName ILIKE any of:
 *     '%Sitemap%', '%OCR%', '%Discovery%', '%Meta%', '%Harvest%'
 *
 *   - "Meaningful evidence" = Evidence.type in (COA, MANUFACTURING, INGREDIENTS, TESTING)
 *     AND sourceName NOT matching discovery patterns.
 *
 * Algorithm:
 *   1. For each domain-keyed Brand: ensure quarantine product exists.
 *   2. For each placeholder under that brand: move Listings + discovery Evidence
 *      to quarantine; if meaningful evidence exists, keep product and set isCanonical=true;
 *      else delete product after moving.
 *   3. For "Unknown Brand" products without domain: derive domain from OFFICIAL
 *      listing URLs; if domain exists, collapse into domain quarantine; else
 *      collapse into global "quarantine-unknown".
 *
 * Usage:
 *   npx tsx scripts/admin/salvageCollapseUnknownPlaceholders.ts --dryRun
 *   npx tsx scripts/admin/salvageCollapseUnknownPlaceholders.ts
 */

import "dotenv/config";

import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { canonicalizeUrl, extractDomain } from "@/lib/urlCanonicalize";

const DRY_RUN = process.argv.includes("--dryRun") || process.argv.includes("--dry-run");

const DISCOVERY_SOURCE_PATTERNS = [
  /sitemap/i,
  /ocr/i,
  /discovery/i,
  /meta/i,
  /harvest/i,
];

const MEANINGFUL_EVIDENCE_TYPES = ["COA", "MANUFACTURING", "INGREDIENTS", "TESTING"] as const;

function isDiscoveryEvidence(sourceName: string | null): boolean {
  if (!sourceName) return false;
  return DISCOVERY_SOURCE_PATTERNS.some((p) => p.test(sourceName));
}

function isMeaningfulEvidence(type: string, sourceName: string | null): boolean {
  if (!MEANINGFUL_EVIDENCE_TYPES.includes(type as (typeof MEANINGFUL_EVIDENCE_TYPES)[number]))
    return false;
  return !isDiscoveryEvidence(sourceName);
}

function isQuarantineProduct(name: string, slug: string): boolean {
  return slug.startsWith("quarantine-") || name.startsWith("Quarantine ");
}

function isUnknownPlaceholder(p: {
  name: string;
  slug: string;
  dataCompleteness: string;
  sourceDsldLabelId: string | null;
  brand: { name: string; slug: string };
}): boolean {
  if (p.dataCompleteness !== "LOW" || p.sourceDsldLabelId != null) return false;
  if (isQuarantineProduct(p.name, p.slug)) return false;
  return (
    p.brand.name === "Unknown Brand" ||
    p.name.startsWith("Unknown") ||
    p.brand.slug.startsWith("domain-")
  );
}

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function ensureQuarantineProduct(
  domain: string,
  brandId: string,
  dryRun: boolean
): Promise<string> {
  const slug = `quarantine-${slugify(domain)}`;
  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) return existing.id;
  if (dryRun) {
    return `dry-run-quarantine-${slug}`;
  }
  const created = await prisma.product.create({
    data: {
      brandId,
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
  return created.id;
}

async function ensureGlobalUnknownQuarantine(dryRun: boolean): Promise<string> {
  const slug = "quarantine-unknown";
  const brandSlug = "domain-unknown";
  let brand = await prisma.brand.findUnique({
    where: { slug: brandSlug },
    select: { id: true },
  });
  if (!brand && !dryRun) {
    brand = await prisma.brand.create({
      data: { name: "Unknown (no domain)", slug: brandSlug },
      select: { id: true },
    });
  } else if (!brand && dryRun) {
    return "dry-run-quarantine-unknown";
  }
  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) return existing.id;
  if (dryRun) return "dry-run-quarantine-unknown";
  const created = await prisma.product.create({
    data: {
      brandId: brand!.id,
      name: "Quarantine \u2013 unknown",
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
      lastVerifiedAt: null,
    },
    select: { id: true },
  });
  return created.id;
}

async function main() {
  log(DRY_RUN ? "=== SALVAGE — DRY RUN (no changes) ===" : "=== SALVAGE — LIVE ===");
  if (DRY_RUN) log("    Run without --dryRun to apply changes.");
  log("");

  const stats = {
    productsCollapsed: 0,
    productsDeleted: 0,
    listingsMoved: 0,
    evidenceMoved: 0,
    meaningfulProductsKept: 0,
    globalUnknownCollapsed: 0,
  };

  // Load all placeholder products with brand and evidence.
  const placeholders = await prisma.product.findMany({
    where: {
      dataCompleteness: "LOW",
      sourceDsldLabelId: null,
    },
    include: {
      brand: { select: { id: true, name: true, slug: true, websiteDomain: true } },
      evidence: { select: { id: true, type: true, sourceName: true } },
      listings: { select: { id: true, url: true, source: true } },
    },
  });

  const toProcess = placeholders.filter((p) => isUnknownPlaceholder(p));
  log(`Found ${toProcess.length} placeholder products to process.`);

  // Group by domain brand (brand.slug starts with "domain-" or brand.websiteDomain set).
  const domainBrands = await prisma.brand.findMany({
    where: {
      OR: [
        { websiteDomain: { not: null } },
        { slug: { startsWith: "domain-" } },
      ],
    },
    select: { id: true, name: true, slug: true, websiteDomain: true },
  });

  const domainByBrandId = new Map<string, string>();
  for (const b of domainBrands) {
    const domain = b.websiteDomain ?? b.name;
    if (domain) domainByBrandId.set(b.id, domain);
  }

  // Process domain-keyed placeholders.
  for (const brand of domainBrands) {
    const domain = brand.websiteDomain ?? brand.name;
    if (!domain) continue;

    const brandPlaceholders = toProcess.filter(
      (p) => p.brandId === brand.id && !isQuarantineProduct(p.name, p.slug)
    );
    if (brandPlaceholders.length === 0) continue;

    const quarantineId = await ensureQuarantineProduct(domain, brand.id, DRY_RUN);
    if (quarantineId.startsWith("dry-run-")) continue;

    for (const prod of brandPlaceholders) {
      const meaningful = prod.evidence.some((e) =>
        isMeaningfulEvidence(e.type, e.sourceName)
      );
      const discoveryEvidence = prod.evidence.filter((e) =>
        isDiscoveryEvidence(e.sourceName)
      );

      if (meaningful) {
        if (!DRY_RUN) {
          await prisma.product.update({
            where: { id: prod.id },
            data: { isCanonical: true },
          });
        }
        stats.meaningfulProductsKept += 1;
        continue;
      }

      // Move listings.
      if (prod.listings.length > 0 && !DRY_RUN) {
        await prisma.listing.updateMany({
          where: { productId: prod.id },
          data: { productId: quarantineId },
        });
        stats.listingsMoved += prod.listings.length;
      } else if (prod.listings.length > 0) {
        stats.listingsMoved += prod.listings.length;
      }

      // Move discovery evidence.
      if (discoveryEvidence.length > 0 && !DRY_RUN) {
        await prisma.evidence.updateMany({
          where: { id: { in: discoveryEvidence.map((e) => e.id) } },
          data: { productId: quarantineId },
        });
        stats.evidenceMoved += discoveryEvidence.length;
      } else if (discoveryEvidence.length > 0) {
        stats.evidenceMoved += discoveryEvidence.length;
      }

      // Delete MergeCandidates for this product.
      if (!DRY_RUN) {
        await prisma.mergeCandidate.deleteMany({
          where: { candidateProductId: prod.id },
        });
      }

      if (!DRY_RUN) {
        await prisma.product.delete({ where: { id: prod.id } });
      }
      stats.productsCollapsed += 1;
      stats.productsDeleted += 1;
    }
  }

  // Process "Unknown Brand" products (no domain brand).
  const unknownBrand = await prisma.brand.findUnique({
    where: { name: "Unknown Brand" },
    select: { id: true },
  });
  if (!unknownBrand) {
    log("No 'Unknown Brand' found.");
  } else {
    const unknownPlaceholders = toProcess.filter((p) => p.brandId === unknownBrand.id);
    log(`Processing ${unknownPlaceholders.length} Unknown Brand placeholders.`);

    const globalQuarantineId = await ensureGlobalUnknownQuarantine(DRY_RUN);

    for (const prod of unknownPlaceholders) {
      const meaningful = prod.evidence.some((e) =>
        isMeaningfulEvidence(e.type, e.sourceName)
      );
      const discoveryEvidence = prod.evidence.filter((e) =>
        isDiscoveryEvidence(e.sourceName)
      );

      // Derive domain from OFFICIAL listing URLs.
      let domain: string | null = null;
      for (const l of prod.listings) {
        if (l.source === "OFFICIAL") {
          domain = extractDomain(l.url);
          if (domain) break;
        }
      }

      let targetQuarantineId: string;

      if (domain) {
        let brandId = domainBrands.find(
          (b) => (b.websiteDomain ?? b.name) === domain
        )?.id;
        if (!brandId && !DRY_RUN) {
          const domainSlug = `domain-${slugify(domain.replace(/^www\./, ""))}`;
          let b = await prisma.brand.findFirst({
            where: {
              OR: [
                { websiteDomain: domain },
                { slug: domainSlug },
                { name: { equals: domain, mode: "insensitive" } },
              ],
            },
            select: { id: true },
          });
          if (!b) {
            b = await prisma.brand.create({
              data: {
                name: domain,
                slug: domainSlug,
                websiteDomain: domain,
                website: `https://${domain}`,
              },
              select: { id: true },
            });
          }
          brandId = b.id;
        } else if (!brandId && DRY_RUN) {
          brandId = unknownBrand.id;
        } else if (!brandId) {
          brandId = unknownBrand.id;
        }
        targetQuarantineId = await ensureQuarantineProduct(
          domain,
          brandId!,
          DRY_RUN
        );
      } else {
        targetQuarantineId = globalQuarantineId;
        stats.globalUnknownCollapsed += 1;
      }

      if (targetQuarantineId.startsWith("dry-run-")) {
        stats.productsCollapsed += 1;
        if (!domain) stats.globalUnknownCollapsed += 1;
        continue;
      }

      if (meaningful) {
        if (!DRY_RUN) {
          await prisma.product.update({
            where: { id: prod.id },
            data: { isCanonical: true },
          });
        }
        stats.meaningfulProductsKept += 1;
        continue;
      }

      if (prod.listings.length > 0 && !DRY_RUN) {
        await prisma.listing.updateMany({
          where: { productId: prod.id },
          data: { productId: targetQuarantineId },
        });
        stats.listingsMoved += prod.listings.length;
      } else if (prod.listings.length > 0) {
        stats.listingsMoved += prod.listings.length;
      }

      if (discoveryEvidence.length > 0 && !DRY_RUN) {
        await prisma.evidence.updateMany({
          where: { id: { in: discoveryEvidence.map((e) => e.id) } },
          data: { productId: targetQuarantineId },
        });
        stats.evidenceMoved += discoveryEvidence.length;
      } else if (discoveryEvidence.length > 0) {
        stats.evidenceMoved += discoveryEvidence.length;
      }

      if (!DRY_RUN) {
        await prisma.mergeCandidate.deleteMany({
          where: { candidateProductId: prod.id },
        });
        await prisma.product.delete({ where: { id: prod.id } });
      }
      stats.productsCollapsed += 1;
      stats.productsDeleted += 1;
    }
  }

  log("");
  log("=== STATS ===");
  log(`  productsCollapsed: ${stats.productsCollapsed}`);
  log(`  productsDeleted: ${stats.productsDeleted}`);
  log(`  listingsMoved: ${stats.listingsMoved}`);
  log(`  evidenceMoved: ${stats.evidenceMoved}`);
  log(`  meaningfulProductsKept: ${stats.meaningfulProductsKept}`);
  log(`  globalUnknownCollapsed: ${stats.globalUnknownCollapsed}`);
  if (DRY_RUN) log("");
  if (DRY_RUN) log("Dry run complete. Run without --dryRun to apply.");
  log("");
}

main()
  .catch((err) => {
    console.error("FATAL:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
