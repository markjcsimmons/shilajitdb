"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecomputeGradesButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [count, setCount] = useState<number | null>(null);
  const router = useRouter();

  async function handleClick() {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/recompute-grades", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCount(data.count);
        setStatus("done");
        router.refresh();
      } else {
        console.error(data);
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {status === "loading" ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" />
              <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
            </svg>
            Recalculating…
          </>
        ) : (
          "Recompute All Grades"
        )}
      </button>
      {status === "done" && (
        <p className="text-sm text-emerald-300">
          ✅ Recomputed {count} products successfully.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-300">
          ❌ Something went wrong. Check the console.
        </p>
      )}
    </div>
  );
}
