import Link from "next/link";

export function AffiliateTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-[#4A3F1A] bg-[#2A2410] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#D9B23C]">
      Affiliate link
    </span>
  );
}

export function AffiliateNote() {
  return (
    <p className="text-xs text-[#6E7A9A]">
      Links marked <AffiliateTag /> are affiliate links — ShilajitDB may earn a commission on
      qualifying purchases at no additional cost to you. This has no effect on the product&rsquo;s
      grade.{" "}
      <Link href="/disclosure" className="underline underline-offset-2 hover:text-[#8892B8] transition-colors">
        Read our disclosure policy →
      </Link>
    </p>
  );
}
