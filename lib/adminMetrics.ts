import { prisma } from "@/lib/db";

export type AdminMetrics = {
  lowCompletenessCount: number;
  pendingMergeCount: number;
  coaPublicCount: number;
  officialUrlSetCount: number;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [lowCompletenessCount, pendingMergeCount, coaPublicCount, officialUrlSetCount] = await Promise.all([
    prisma.product.count({ where: { dataCompleteness: "LOW" } }),
    prisma.mergeCandidate.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { coaStatus: "PUBLIC" } }),
    prisma.product.count({ where: { officialCanonicalUrl: { not: null } } }),
  ]);
  return { lowCompletenessCount, pendingMergeCount, coaPublicCount, officialUrlSetCount };
}
