import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { crmNotes } from "@/lib/db/schema";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let json: { body?: string };
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const text = (json.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Note body required" }, { status: 422 });

  const clean = text
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .slice(0, 5000);

  const [note] = await db
    .insert(crmNotes)
    .values({ recordType: "ticket", recordId: ticketId, body: clean })
    .returning();

  return NextResponse.json({ note }, { status: 201 });
}
