import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { clientRegistrations, contactEnquiries, crmNotes } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { parseCrmId } from "@/lib/crm-types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = parseCrmId(id);
  if (!parsed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let record;
  if (parsed.recordType === "registration") {
    [record] = await db.select().from(clientRegistrations).where(eq(clientRegistrations.id, parsed.id));
  } else {
    [record] = await db.select().from(contactEnquiries).where(eq(contactEnquiries.id, parsed.id));
  }
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const notes = await db
    .select()
    .from(crmNotes)
    .where(and(eq(crmNotes.recordType, parsed.recordType), eq(crmNotes.recordId, parsed.id)))
    .orderBy(asc(crmNotes.createdAt));

  return NextResponse.json({ recordType: parsed.recordType, record, notes });
}
