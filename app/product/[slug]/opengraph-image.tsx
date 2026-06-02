import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { gradeLabel } from "@/lib/grade-colors";
import { labelQualityTier } from "@/lib/labels";
import type { OverallGrade, QualityTier } from "@prisma/client";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function gradeColor(grade: OverallGrade | null): string {
  switch (grade) {
    case "A_PLUS":
    case "A":  return "#22C55E";
    case "B":  return "#3B82F6";
    case "C":  return "#EAB308";
    case "D":
    case "E":
    case "F":  return "#EF4444";
    default:   return "#4A5070";
  }
}

function gradeBg(grade: OverallGrade | null): string {
  switch (grade) {
    case "A_PLUS":
    case "A":  return "#052010";
    case "B":  return "#051428";
    case "C":  return "#201800";
    case "D":
    case "E":
    case "F":  return "#200505";
    default:   return "#1F2540";
  }
}

function tierColor(tier: QualityTier): string {
  switch (tier) {
    case "ULTRA_PREMIUM": return "#22C55E";
    case "PREMIUM":       return "#3B82F6";
    case "AVERAGE":       return "#EAB308";
    case "POOR":          return "#EF4444";
    default:              return "#6E7A9A";
  }
}

export default async function ProductOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: { slug, isCanonical: true },
    select: {
      name: true,
      form: true,
      overallGrade: true,
      qualityTier: true,
      transparencyGrade: true,
      coaStatus: true,
      manufacturingCountryClaim: true,
      brand: { select: { name: true } },
    },
  });

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: "#080B14",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 700, color: "#EEF0F8" }}>Shilajit</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#3D7AFF" }}>DB</span>
        </div>
      ),
      { ...size }
    );
  }

  const grade = product.overallGrade;
  const color = gradeColor(grade);
  const bg = gradeBg(grade);
  const gradeText = gradeLabel(grade);
  const tier = labelQualityTier(product.qualityTier);
  const tColor = tierColor(product.qualityTier);

  const coaLabel =
    product.coaStatus === "PUBLIC" ? "Public COA" :
    product.coaStatus === "PUBLIC_EMBEDDED" ? "Embedded COA" :
    product.coaStatus === "REQUEST_ONLY" ? "COA on request" :
    "No COA";

  const formLabel = product.form
    ? product.form.charAt(0) + product.form.slice(1).toLowerCase()
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#080B14",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#EEF0F8", letterSpacing: "-0.5px" }}>
            Shilajit
          </span>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#3D7AFF", letterSpacing: "-0.5px" }}>
            DB
          </span>
        </div>

        {/* Centre: grade badge + product info side by side */}
        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          {/* Grade badge */}
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 24,
              background: bg,
              border: `3px solid ${color}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 96,
                fontWeight: 800,
                color: color,
                lineHeight: 1,
                fontFamily: "monospace",
              }}
            >
              {gradeText}
            </span>
          </div>

          {/* Product info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 16, color: "#6E7A9A", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {product.brand.name}
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: "#EEF0F8",
                  lineHeight: 1.15,
                  letterSpacing: "-0.5px",
                }}
              >
                {product.name}
              </div>
            </div>

            {/* Pills */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* Tier */}
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: `1px solid ${tColor}50`,
                  background: `${tColor}15`,
                  fontSize: 13,
                  fontWeight: 600,
                  color: tColor,
                }}
              >
                {tier}
              </div>

              {/* COA */}
              {product.coaStatus === "PUBLIC" && (
                <div
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px solid #22C55E50",
                    background: "#22C55E15",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#22C55E",
                  }}
                >
                  ✓ {coaLabel}
                </div>
              )}

              {/* Form */}
              {formLabel && (
                <div
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px solid #252A40",
                    background: "#0F1320",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#8892B8",
                  }}
                >
                  {formLabel}
                </div>
              )}

              {/* Made in */}
              {product.manufacturingCountryClaim && (
                <div
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px solid #252A40",
                    background: "#0F1320",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#8892B8",
                  }}
                >
                  Made in {product.manufacturingCountryClaim}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: trust badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#6E7A9A" }}>
            shilajitdb.com — Independent grading, unaffiliated with any brand
          </span>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "8px 18px",
              border: "1px solid #252A40",
              borderRadius: 999,
              background: "#0F1320",
            }}
          >
            <span style={{ fontSize: 12, color: "#3D7AFF", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Transparency Database
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
