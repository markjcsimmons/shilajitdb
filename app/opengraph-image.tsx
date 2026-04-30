import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Shilajit Transparency Database";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const [productCount, coaCount] = await Promise.all([
    prisma.product.count({ where: { isCanonical: true, dataCompleteness: { not: "LOW" } } }),
    prisma.product.count({ where: { isCanonical: true, coaStatus: "PUBLIC" } }),
  ]);
  const coaPct = productCount > 0 ? Math.round((coaCount / productCount) * 100) : 0;

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
          <span style={{ fontSize: 32, fontWeight: 700, color: "#EEF0F8", letterSpacing: "-0.5px" }}>
            Shilajit
          </span>
          <span style={{ fontSize: 32, fontWeight: 700, color: "#3D7AFF", letterSpacing: "-0.5px" }}>
            DB
          </span>
        </div>

        {/* Centre: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#EEF0F8",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              maxWidth: 720,
            }}
          >
            Shilajit Transparency Database
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#8892B8",
              lineHeight: 1.5,
              maxWidth: 620,
            }}
          >
            Every product graded on COA quality, lab credibility, heavy metal safety,
            and manufacturing transparency.
          </div>
        </div>

        {/* Bottom: stats + trust badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Stats */}
          <div style={{ display: "flex", gap: 40 }}>
            {[
              { value: String(productCount), label: "products graded" },
              { value: `${coaPct}%`, label: "with public COA" },
            ].map(({ value, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#EEF0F8", letterSpacing: "-0.5px" }}>
                  {value}
                </span>
                <span style={{ fontSize: 14, color: "#6E7A9A", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 20px",
              border: "1px solid #252A40",
              borderRadius: 999,
              background: "#0F1320",
            }}
          >
            <span style={{ fontSize: 13, color: "#3D7AFF", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Independent · Unaffiliated · Free
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
