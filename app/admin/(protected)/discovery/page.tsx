import { Button, Input } from "@/components/ui";
import { prisma } from "@/lib/db";
import { importListingsCsv } from "@/scripts/ingest/discovery/importCsv";
import fs from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString();
}

export default async function AdminDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ ran?: string }>;
}) {
  const { ran } = await searchParams;

  async function importListingsCsvAction(formData: FormData) {
    "use server";
    const file = formData.get("file");
    if (!(file instanceof File)) return;
    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), ".cache", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const p = path.join(dir, `listings-${Date.now()}.csv`);
    await fs.writeFile(p, buf);
    await importListingsCsv({ csvPath: p, dryRun: false, wrapRun: true });
    redirect("/admin/discovery?ran=csv_import");
  }

  async function approveMergeCandidateAction(id: string) {
    "use server";
    await prisma.$transaction(async (tx) => {
      const mc = await tx.mergeCandidate.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          listingId: true,
          candidateProductId: true,
          listing: { select: { productId: true } },
        },
      });
      if (!mc || mc.status !== "PENDING") return;

      const placeholderProductId = mc.listing.productId;

      // Move listing to the candidate product.
      await tx.listing.update({
        where: { id: mc.listingId },
        data: { productId: mc.candidateProductId },
        select: { id: true },
      });

      // Approve this candidate; reject all other candidates for this listing.
      await tx.mergeCandidate.update({
        where: { id: mc.id },
        data: { status: "APPROVED" },
      });
      await tx.mergeCandidate.updateMany({
        where: { listingId: mc.listingId, id: { not: mc.id }, status: "PENDING" },
        data: { status: "REJECTED" },
      });

      // Delete placeholder product only if ALL are true: no listings remain, no evidence, no mergeCandidates, dataCompleteness == LOW
      const placeholder = await tx.product.findUnique({
        where: { id: placeholderProductId },
        select: {
          id: true,
          dataCompleteness: true,
          evidence: { select: { id: true } },
          listings: { select: { id: true } },
          mergeCandidates: { select: { id: true } },
        },
      });
      if (!placeholder) return;
      const noListings = placeholder.listings.length === 0;
      const noEvidence = placeholder.evidence.length === 0;
      const noMergeCandidates = placeholder.mergeCandidates.length === 0;
      const isLowCompleteness = placeholder.dataCompleteness === "LOW";
      if (
        noListings &&
        noEvidence &&
        noMergeCandidates &&
        isLowCompleteness
      ) {
        console.info("Deleted placeholder product", placeholder.id);
        await tx.product.delete({ where: { id: placeholder.id } });
      }
    });
    redirect("/admin/discovery?ran=approved");
  }

  async function rejectMergeCandidateAction(id: string) {
    "use server";
    await prisma.mergeCandidate.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "REJECTED" },
    });
    redirect("/admin/discovery?ran=rejected");
  }

  const pending = await prisma.mergeCandidate.findMany({
    where: { status: "PENDING" },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }],
    take: 100,
    include: {
      listing: {
        include: {
          product: { include: { brand: true } },
        },
      },
      candidateProduct: { include: { brand: true } },
    },
  });

  const [lowCompletenessCount, pendingMergeCount, coaPublicCount, officialUrlCount] =
    await Promise.all([
      prisma.product.count({ where: { dataCompleteness: "LOW" } }),
      prisma.mergeCandidate.count({ where: { status: "PENDING" } }),
      prisma.product.count({ where: { coaStatus: "PUBLIC" } }),
      prisma.product.count({ where: { officialCanonicalUrl: { not: null } } }),
    ]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Review merge queue</h1>
        <p className="mt-1 text-sm text-slate-600">
          Approve or reject suggested product merges from discovery. You can also upload more Listings CSV here.
        </p>

        {ran ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Done: <span className="font-medium">{ran}</span>.
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Products (LOW completeness)
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{lowCompletenessCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Merge queue (pending)
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{pendingMergeCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              COA public
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{coaPublicCount}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Official URL set
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{officialUrlCount}</div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-900">Listings CSV import</div>
          <p className="mt-1 text-sm text-slate-600">
            Upload a CSV with columns: <code>url</code>, <code>source</code>, <code>title</code>,{" "}
            <code>brandName</code>, <code>observedGtin</code>, <code>observedSku</code>,{" "}
            <code>netQuantityText</code>, <code>form</code>.
          </p>
          <form action={importListingsCsvAction} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input name="file" type="file" accept=".csv,text/csv" required />
            <Button type="submit" variant="secondary">
              Import CSV
            </Button>
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Merge review queue (pending)
        </div>
        <div className="divide-y divide-slate-200">
          {pending.length ? (
            pending.map((mc) => (
              <div key={mc.id} className="px-5 py-4 text-sm text-slate-700">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">
                      {mc.listing.source} · {mc.confidence.toFixed(2)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Created: {fmtDate(mc.createdAt)} · Listing last seen: {fmtDate(mc.listing.lastSeenAt)}
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="text-slate-500">Listing</div>
                      <div className="truncate">
                        <a href={mc.listing.url} target="_blank" rel="nofollow" className="underline underline-offset-4">
                          {mc.listing.title ?? mc.listing.url}
                        </a>
                      </div>
                      <div className="text-xs text-slate-500">
                        Observed GTIN: {mc.listing.observedGtin ?? "—"} · SKU: {mc.listing.observedSku ?? "—"}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <div className="text-slate-500">Current product (placeholder)</div>
                        <div className="text-slate-900">
                          {mc.listing.product.brand.name} — {mc.listing.product.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          form: {mc.listing.product.form} · qty: {mc.listing.product.netQuantityText ?? "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Candidate product</div>
                        <div className="text-slate-900">
                          {mc.candidateProduct.brand.name} — {mc.candidateProduct.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          form: {mc.candidateProduct.form} · qty: {mc.candidateProduct.netQuantityText ?? "—"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      Reasons: {mc.reasons.length ? mc.reasons.join(", ") : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={approveMergeCandidateAction.bind(null, mc.id)}>
                      <Button type="submit">Approve</Button>
                    </form>
                    <form action={rejectMergeCandidateAction.bind(null, mc.id)}>
                      <Button type="submit" variant="secondary">
                        Reject
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-sm text-slate-700">No pending merge candidates.</div>
          )}
        </div>
      </div>
    </div>
  );
}

