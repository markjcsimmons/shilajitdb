import { Button } from "@/components/ui";
import { isAdminAuthed } from "@/lib/admin-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/admin" className="text-slate-700 hover:text-slate-900">
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/admin/brands" className="text-slate-700 hover:text-slate-900">
            Brands
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/admin/products" className="text-slate-700 hover:text-slate-900">
            Products
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/admin/ingestion" className="text-slate-700 hover:text-slate-900">
            Ingestion
          </Link>
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

