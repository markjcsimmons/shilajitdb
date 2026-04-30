import { Button } from "@/components/ui";
import { isAdminAuthed } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-500">
          <Link href="/admin" className="hover:text-slate-900 transition-colors">Dashboard</Link>
          <span className="text-slate-300 select-none">·</span>
          <Link href="/admin/populate" className="hover:text-slate-900 transition-colors">Populate</Link>
          <span className="text-slate-300 select-none">·</span>
          <Link href="/admin/brands" className="hover:text-slate-900 transition-colors">Brands</Link>
          <span className="text-slate-300 select-none">·</span>
          <Link href="/admin/products" className="hover:text-slate-900 transition-colors">Products</Link>
          <span className="text-slate-300 select-none">·</span>
          <Link href="/admin/data" className="hover:text-slate-900 transition-colors">Data</Link>
          <span className="text-slate-300 select-none">·</span>
          <Link href="/admin/editors-picks" className="hover:text-slate-900 transition-colors">Editor&apos;s Picks</Link>
        </nav>
        <form action="/admin/logout" method="POST">
          <Button type="submit" variant="secondary">
            Log out
          </Button>
        </form>
      </div>
      {children}
    </div>
  );
}

