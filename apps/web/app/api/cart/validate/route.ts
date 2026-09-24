import { NextResponse } from "next/server";
import { validateCartOffers } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { items?: { offerId: string; quantity: number }[] }
    | null;
  const items = body?.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const results = await validateCartOffers(items);
  return NextResponse.json({ results });
}
