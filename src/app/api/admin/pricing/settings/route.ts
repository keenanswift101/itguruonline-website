import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { siteSettings } from "@/lib/db/schema";

// Allow-list of editable keys — reject unknown keys so the settings table can't be polluted.
const ALLOWED_KEYS = ["contact_email", "hosting_setup_fee_note"] as const;

const PatchSchema = z
  .object({
    contact_email: z.string().email().optional(),
    hosting_setup_fee_note: z.string().max(500).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Update each provided key/value row (rows were seeded by 03-01 migration).
  for (const key of ALLOWED_KEYS) {
    const value = parsed.data[key];
    if (value !== undefined) {
      await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
    }
  }
  return NextResponse.json({ ok: true });
}
