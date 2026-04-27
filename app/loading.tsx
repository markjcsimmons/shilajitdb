export default function RootLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[#4A5070]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#252A40] border-t-[#3D7AFF]" aria-hidden />
      <p className="text-sm">Loading…</p>
    </div>
  );
}
