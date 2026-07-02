import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { hostingPackages } from "@/lib/db/schema";

const PatchSchema = z
  .object({
    name: z.string().min(1).max(64).optional(),
    priceRands: z.number().int().positive().optional(),
    pricePeriod: z.enum(["mo", "yr"]).optional(),
    description: z.string().optional(),
    features: z.string().optional(), // newline-separated text, stored raw
    isPopular: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

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

  await db.update(hostingPackages).set(parsed.data).where(eq(hostingPackages.id, id));
  return NextResponse.json({ ok: true });
}
