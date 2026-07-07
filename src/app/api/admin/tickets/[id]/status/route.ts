import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { tickets } from "@/lib/db/schema";
import { ALLOWED_TRANSITIONS } from "@/lib/ticket-status";

export const dynamic = "force-dynamic";

const statusInput = z.object({ status: z.enum(["open", "in_progress", "resolved"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = statusInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const target = parsed.data.status;

  const [t] = await db.select({ status: tickets.status }).from(tickets).where(eq(tickets.id, numId));
  if (!t) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

  if (!ALLOWED_TRANSITIONS[t.status as keyof typeof ALLOWED_TRANSITIONS]?.includes(target)) {
    return NextResponse.json({ error: "Invalid status transition." }, { status: 409 });
  }

  if (target === "resolved") {
    await db.update(tickets).set({ status: "resolved", resolvedAt: new Date() }).where(eq(tickets.id, numId));
  } else {
    // Reopening (→open / →in_progress) clears resolvedAt so a re-resolve gets a fresh stamp.
    await db.update(tickets).set({ status: target, resolvedAt: null }).where(eq(tickets.id, numId));
  }

  return NextResponse.json({ ok: true });
}
