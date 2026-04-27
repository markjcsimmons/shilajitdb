import { Button } from "@/components/ui";
import { buildQueryString, type ProductFilters } from "@/lib/search";

export function Pagination({
  total,
  filters,
  pageSize,
}: {
  total: number;
  filters: ProductFilters;
  pageSize: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(filters.page, totalPages);

  if (totalPages <= 1) return null;

  const prevHref = buildQueryString({ ...filters, page: Math.max(1, page - 1) });
  const nextHref = buildQueryString({ ...filters, page: Math.min(totalPages, page + 1) });

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <div className="text-sm text-[#4A5070]">
        Page <span className="font-medium text-[#EEF0F8]">{page}</span> of{" "}
        <span className="font-medium text-[#EEF0F8]">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button href={prevHref} variant="secondary" aria-disabled={page <= 1}>
          Previous
        </Button>
        <Button href={nextHref} variant="secondary" aria-disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}

