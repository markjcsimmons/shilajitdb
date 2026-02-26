import { Button, Input } from "@/components/ui";
import { checkAdminPassword, isAdminAuthed, setAdminSessionCookie } from "@/lib/admin-auth";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if ((process.env.ADMIN_DISABLE_AUTH ?? "").toLowerCase().trim() === "true") redirect("/admin");
  if (await isAdminAuthed()) redirect("/admin");
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const password = String(formData.get("password") ?? "");
    if (!checkAdminPassword(password)) redirect("/admin/login?error=1");
    await setAdminSessionCookie();
    redirect("/admin");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-lg font-semibold tracking-tight text-slate-900">Admin login</h1>
      <p className="mt-2 text-sm text-slate-700">
        Enter the admin password to manage brands, products, and evidence.
      </p>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          Incorrect password.
        </div>
      ) : null}

      <form action={login} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-700">Password</label>
          <Input name="password" type="password" autoComplete="current-password" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Button type="submit">Sign in</Button>
          <Link href="/" className="text-sm text-slate-700 hover:text-slate-900">
            Back to site
          </Link>
        </div>
      </form>
    </div>
  );
}

