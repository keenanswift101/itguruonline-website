import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { billingSchedules } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  isActive: z.boolean().optional(),
  clientName: z.string().min(1).max(128).optional(),
  clientEmail: z.string().email().optional().or(z.literal("")).optional(),
  packageId: z.number().int().positive().nullable().optional(),
  billingStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const scheduleId = parseInt(id, 10);
  if (isNaN(scheduleId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;
  if (parsed.data.clientName !== undefined) updates.clientName = parsed.data.clientName;
  if (parsed.data.clientEmail !== undefined) updates.clientEmail = parsed.data.clientEmail || null;
  if (parsed.data.packageId !== undefined) updates.packageId = parsed.data.packageId;
  if (parsed.data.billingStart !== undefined) updates.billingStart = parsed.data.billingStart;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(billingSchedules)
    .set(updates)
    .where(eq(billingSchedules.id, scheduleId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ schedule: updated });
}
