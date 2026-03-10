"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  const msg = error?.message ?? "Something went wrong.";
  const isDb =
    /prisma|database|connection|P1001|ECONNREFUSED|connect|engine is not yet connected|_napi_register_module/i.test(msg) ||
    (error?.cause && String(error.cause).includes("connect"));

  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6">
      <h1 className="text-lg font-semibold text-rose-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-rose-800">{msg}</p>
      {isDb && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-white/60 p-4 text-sm text-rose-900">
          <p className="font-medium">DB / Prisma engine issue. Try:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Reset:</strong> Run <code className="rounded bg-rose-100 px-1">npm run reset:prisma-next</code> then <code className="rounded bg-rose-100 px-1">npm run dev</code>.
            </li>
            <li>
              <strong>Health check:</strong> <Link href="/api/health/db" className="underline">/api/health/db</Link> — verify DB connectivity.
            </li>
            <li>
              <strong>Webpack fallback:</strong> If using Turbopack, try <code className="rounded bg-rose-100 px-1">npm run dev:webpack</code>.
            </li>
          </ul>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-50"
        >
          Go home
        </Link>
        <Link
          href="/admin"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Admin
        </Link>
      </div>
    </div>
  );
}
