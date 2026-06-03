import { NextResponse } from "next/server";
import {
  buildPartsCatalog,
  fetchPhstudyMasterdata,
  toCatalogResponse,
} from "@/lib/phstudy/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "zh-TW";

  try {
    const masterdata = await fetchPhstudyMasterdata();
    const categories = buildPartsCatalog(masterdata, locale);
    const body = toCatalogResponse(
      categories,
      locale,
      new Date().toISOString()
    );

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load parts catalog";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
