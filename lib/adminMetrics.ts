import { prisma } from "@/lib/db";

export type AdminMetrics = {
  lowCompletenessCount: number;
  coaPublicCount: number;
  officialUrlSetCount: number;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [lowCompletenessCount, coaPublicCount, officialUrlSetCount] = await Promise.all([
    prisma.product.count({ where: { dataCompleteness: "LOW" } }),
    prisma.product.count({ where: { coaStatus: "PUBLIC" } }),
    prisma.product.count({ where: { officialCanonicalUrl: { not: null } } }),
  ]);
  return { lowCompletenessCount, coaPublicCount, officialUrlSetCount };
}
