"use client";

import { useId, useState } from "react";

const MIN = 140;
const MAX = 160;

export function MetaDescriptionField({
  name,
  defaultValue = "",
  placeholder = "Optional. Used for search results and social sharing. 140–160 characters.",
  errorFromServer,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  errorFromServer?: string | null;
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue ?? "");
  const len = value.length;
  const _isEmpty = len === 0;
  const tooShort = len > 0 && len < MIN;
  const tooLong = len > MAX;
  const ok = len >= MIN && len <= MAX;

  let prompt: string | null = null;
  if (tooShort) prompt = `Write more — at least ${MIN} characters (currently ${len}).`;
  else if (tooLong) prompt = `Write less — at most ${MAX} characters (currently ${len}).`;
  else if (ok) prompt = `${len} characters — good for search results.`;

  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-slate-700">
        Meta description (optional)
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX + 20}
        className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
      />
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 text-xs">
        <span className="text-slate-500">
          {len} / {MIN}–{MAX} characters
        </span>
        {prompt && (
          <span
            className={
              tooShort || tooLong
                ? "font-medium text-amber-700"
                : "text-slate-600"
            }
          >
            {prompt}
          </span>
        )}
      </div>
      {errorFromServer && (
        <p className="mt-1 text-xs font-medium text-rose-600">{errorFromServer}</p>
      )}
      <p className="mt-1 text-xs text-slate-500">
        Leave empty to use the default. If set, must be 140–160 characters for search snippets.
      </p>
    </div>
  );
}
