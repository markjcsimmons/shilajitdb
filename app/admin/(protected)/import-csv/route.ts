import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { importBrandProductCsv } from "@/lib/importBrandProductCsv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const nextUrl = String(new URL(request.url).searchParams.get("next") || "/admin/populate").trim();

  try {
    if (!(await isAdminAuthed())) {
      return NextResponse.redirect(new URL("/admin/login", request.url), 303);
    }

    let file: File;
    try {
      const formData = await request.formData();
      file = formData.get("file") as File;
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.redirect(
          new URL(`${nextUrl}?error=${encodeURIComponent("No CSV file provided")}`, request.url),
          303
        );
      }
    } catch {
      return NextResponse.redirect(
        new URL(`${nextUrl}?error=${encodeURIComponent("Invalid request")}`, request.url),
        303
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const result = await importBrandProductCsv(buf);

    if (result.errors.length > 0) {
      return NextResponse.redirect(
        new URL(`${nextUrl}?error=${encodeURIComponent(result.errors.slice(0, 3).join("; "))}`, request.url),
        303
      );
    }

    const msg = [
      result.brandsCreated && `${result.brandsCreated} brands created`,
      result.brandsUpdated && `${result.brandsUpdated} brands updated`,
      result.productsCreated && `${result.productsCreated} products created`,
      result.productsSkipped && `${result.productsSkipped} products skipped (already exist)`,
    ]
      .filter(Boolean)
      .join(", ");
    return NextResponse.redirect(
      new URL(`${nextUrl}?ran=import&imported=${encodeURIComponent(msg || "Done")}`, request.url),
      303
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[import-csv]", message, err instanceof Error ? err.stack : "");
    return NextResponse.redirect(
      new URL(`${nextUrl}?error=${encodeURIComponent("Import failed: " + message)}`, request.url),
      303
    );
  }
}
