export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
