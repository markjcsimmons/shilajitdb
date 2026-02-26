import { adminUpsertBrand } from "@/app/admin/actions";
import { Button, Input } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AdminBrandNewPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">New brand</h1>
      <p className="mt-1 text-sm text-slate-600">Create a brand record.</p>

      <form action={adminUpsertBrand} className="mt-6 space-y-4">
        <input type="hidden" name="id" value="" />
        <div>
          <label className="text-xs font-medium text-slate-700">Name</label>
          <Input name="name" placeholder="Brand name" required />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">Slug (optional)</label>
          <Input name="slug" placeholder="auto-generated if blank" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">Website (optional)</label>
          <Input name="website" placeholder="https://…" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">Description (optional)</label>
          <textarea
            name="description"
            className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit">Save brand</Button>
          <Button href="/admin/brands" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

