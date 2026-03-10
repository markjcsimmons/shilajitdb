import { Button } from "@/components/ui";
import { isAdminAuthed } from "@/lib/admin-auth";
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
          <a href="/admin" className="text-slate-700 hover:text-slate-900">
            Dashboard
          </a>
          <span className="text-slate-300">/</span>
          <a href="/admin/populate" className="text-slate-700 hover:text-slate-900">
            Populate
          </a>
          <span className="text-slate-300">/</span>
          <a href="/admin/discovery" className="text-slate-700 hover:text-slate-900">
            Review
          </a>
          <span className="text-slate-300">/</span>
          <a href="/admin/brands" className="text-slate-700 hover:text-slate-900">
            Brands
          </a>
          <span className="text-slate-300">/</span>
          <a href="/admin/products" className="text-slate-700 hover:text-slate-900">
            Products
          </a>
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

