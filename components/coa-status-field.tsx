"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui";
import type { CoaStatus } from "@prisma/client";

type Suggestion = {
  status: "PUBLIC" | "PUBLIC_EMBEDDED";
  label: string;
  reason: string;
  color: "emerald" | "amber";
};

function analyzeUrl(url: string, brandDomain: string): Suggestion | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let hostname: string;
  try {
    hostname = new URL(trimmed).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null; // not a valid URL yet
  }

  const lower = trimmed.toLowerCase();
  const isPdf =
    lower.endsWith(".pdf") || lower.includes(".pdf?") || lower.includes(".pdf#");
  const isImageFile = /\.(jpg|jpeg|png|webp|gif|avif)(\?|#|$)/i.test(lower);
  const cleanBrand = brandDomain.replace(/^www\./, "").toLowerCase();
  const isOnBrandDomain = !!cleanBrand && hostname === cleanBrand;

  if (isPdf) {
    return {
      status: "PUBLIC",
      label: "Public — standalone document",
      reason: "URL is a direct .pdf link → standalone document.",
      color: "emerald",
    };
  }

  if (isImageFile && isOnBrandDomain) {
    return {
      status: "PUBLIC_EMBEDDED",
      label: "Public — page-embedded image",
      reason: "URL is an image file hosted on the brand's own domain → embedded COA.",
      color: "amber",
    };
  }

  if (!isOnBrandDomain) {
    return {
      status: "PUBLIC",
      label: "Public — standalone document",
      reason: `URL is on a third-party domain (${hostname}) → likely an independent lab document.`,
      color: "emerald",
    };
  }

  // On brand's own domain, not a PDF
  return {
    status: "PUBLIC_EMBEDDED",
    label: "Public — page-embedded image",
    reason: `URL is on the brand's own domain (${hostname}) and is not a PDF → likely a page or embedded image.`,
    color: "amber",
  };
}

export function CoaStatusField({
  initialStatus,
  initialUrl,
  brandDomain,
}: {
  initialStatus: CoaStatus;
  initialUrl: string;
  brandDomain: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [status, setStatus] = useState<CoaStatus>(initialStatus);

  const suggestion = analyzeUrl(url, brandDomain);
  const showSuggestion =
    suggestion &&
    url.trim() !== "" &&
    suggestion.status !== status;

  function applySuggestion() {
    if (!suggestion) return;
    setStatus(suggestion.status);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* Status select */}
      <div>
        <label className="text-xs font-medium text-slate-700">COA status</label>
        <Select
          name="coaStatus"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value as CoaStatus)}
        >
          <option value="PUBLIC">Public — standalone document (+4)</option>
          <option value="PUBLIC_EMBEDDED">Public — page-embedded image (+2)</option>
          <option value="REQUEST_ONLY">On request only (+1)</option>
          <option value="NONE">None (+0)</option>
          <option value="UNKNOWN">Unknown (+0)</option>
        </Select>
        <p className="mt-1 text-xs text-slate-500">
          Use <strong>page-embedded</strong> when the COA is shown as an image
          on the brand&apos;s product page rather than a dedicated, downloadable
          document.
        </p>
      </div>

      {/* URL input + suggestion */}
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-slate-700">
          COA URL (optional)
        </label>
        <Input
          name="coaUrl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://lab.com/report.pdf or https://brand.com/coa-page"
        />

        {/* Auto-suggestion banner */}
        {showSuggestion && suggestion && (
          <div
            className={
              suggestion.color === "emerald"
                ? "mt-2 flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"
                : "mt-2 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
            }
          >
            <div>
              <p
                className={
                  suggestion.color === "emerald"
                    ? "text-xs font-medium text-emerald-800"
                    : "text-xs font-medium text-amber-800"
                }
              >
                Suggested: {suggestion.label}
              </p>
              <p
                className={
                  suggestion.color === "emerald"
                    ? "mt-0.5 text-xs text-emerald-700"
                    : "mt-0.5 text-xs text-amber-700"
                }
              >
                {suggestion.reason}
              </p>
            </div>
            <button
              type="button"
              onClick={applySuggestion}
              className={
                suggestion.color === "emerald"
                  ? "shrink-0 rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                  : "shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
              }
            >
              Apply
            </button>
          </div>
        )}

        {/* Confirmation — status already matches suggestion */}
        {suggestion && url.trim() !== "" && suggestion.status === status && (
          <p
            className={
              suggestion.color === "emerald"
                ? "mt-1 text-xs text-emerald-700"
                : "mt-1 text-xs text-amber-700"
            }
          >
            ✓ {suggestion.reason}
          </p>
        )}
      </div>
    </div>
  );
}
