"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/components/ui";

export function CompareSwapper({
  slugA,
  slugB,
  options,
}: {
  slugA: string;
  slugB: string;
  options: Array<{ slug: string; label: string }>;
}) {
  const router = useRouter();
  const [newA, setNewA] = useState(slugA);
  const [newB, setNewB] = useState(slugB);

  function navigate(a: string, b: string) {
    if (a === b) return;
    const [x, y] = [a, b].sort();
    router.push(`/compare/${x}-vs-${y}`);
  }

  const optionsForA = options.filter((o) => o.slug !== slugB);
  const optionsForB = options.filter((o) => o.slug !== slugA);

  return (
    <div className="mt-5 pt-4 border-t border-[#252A40] grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <p className="text-xs text-[#4A5070] mb-1.5">Change left product</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <Select value={newA} onChange={(e) => setNewA(e.target.value)}>
              {optionsForA.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={newA === slugA}
            onClick={() => navigate(newA, slugB)}
          >
            Go →
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs text-[#4A5070] mb-1.5">Change right product</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <Select value={newB} onChange={(e) => setNewB(e.target.value)}>
              {optionsForB.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={newB === slugB}
            onClick={() => navigate(slugA, newB)}
          >
            Go →
          </Button>
        </div>
      </div>
    </div>
  );
}
