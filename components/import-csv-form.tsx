"use client";

import { useRef, useState } from "react";

export function ImportCsvForm({ action }: { action: string }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit() {
    setLoading(true);
  }

  return (
    <form
      ref={formRef}
      action={action}
      method="post"
      encType="multipart/form-data"
      className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={handleSubmit}
    >
      <input
        name="file"
        type="file"
        accept=".csv,text/csv"
        required
        className="max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Importing…
          </>
        ) : (
          "Import"
        )}
      </button>

      {loading && (
        <p className="text-sm text-slate-500">
          Processing{fileName ? ` "${fileName}"` : ""}… this may take a moment.
        </p>
      )}
    </form>
  );
}
