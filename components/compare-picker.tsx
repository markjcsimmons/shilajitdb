"use client";

import { Button, Select } from "@/components/ui";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function ComparePicker({
  currentSlug,
  options,
}: {
  currentSlug: string;
  options: Array<{ slug: string; label: string }>;
}) {
  const router = useRouter();
  const filtered = useMemo(
    () => options.filter((o) => o.slug !== currentSlug),
    [options, currentSlug]
  );
  const [other, setOther] = useState<string>(filtered[0]?.slug ?? "");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <Select value={other} onChange={(e) => setOther(e.target.value)}>
          {filtered.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <Button
        type="button"
        onClick={() => {
          if (!other) return;
          router.push(`/compare/${currentSlug}-vs-${other}`);
        }}
        variant="secondary"
        disabled={!other}
      >
        Compare
      </Button>
    </div>
  );
}

