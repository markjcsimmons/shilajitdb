export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-1 h-4 w-48 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-10 gap-0 border-b border-slate-200 bg-slate-50 px-5 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-16 animate-pulse rounded bg-slate-200" />
          ))}
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="grid grid-cols-10 gap-1 px-5 py-4 sm:items-center">
              <div className="col-span-3 h-4 w-40 animate-pulse rounded bg-slate-100" />
              <div className="col-span-2 h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="col-span-2 h-4 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-6 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-12 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-12 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
