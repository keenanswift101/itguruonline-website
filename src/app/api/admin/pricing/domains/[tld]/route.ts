import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { domainPrices } from "@/lib/db/schema";

// priceRands is nullable: a number sets it, null clears it. Both are valid.
const PatchSchema = z.object({
  priceRands: z.number().int().positive().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tld: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tld: tldParam } = await params;
  const tld = decodeURIComponent(tldParam); // ".co.za" was encodeURIComponent'd by the client

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  await db
    .update(domainPrices)
    .set({ priceRands: parsed.data.priceRands })
    .where(eq(domainPrices.tld, tld));
  return NextResponse.json({ ok: true });
}
