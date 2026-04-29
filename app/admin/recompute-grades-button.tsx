"use client";

import { useFormStatus } from "react-dom";

export function RecomputeGradesButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {pending ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" />
            <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
          </svg>
          Recalculating…
        </>
      ) : (
        "Recompute All Grades"
      )}
    </button>
  );
}
