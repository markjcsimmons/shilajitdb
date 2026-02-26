"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

export function CancelButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" disabled={pending} className="h-8 px-2 py-1 text-xs">
      {pending ? "Cancelling..." : "Cancel"}
    </Button>
  );
}

