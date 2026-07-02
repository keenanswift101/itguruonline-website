import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { clientRegistrations, contactEnquiries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CRM_STATUSES, parseCrmId } from "@/lib/crm-types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = parseCrmId(id);
  if (!parsed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { status?: string; recordType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.status || !(CRM_STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 422 });
  }

  const recordType = body.recordType ?? parsed.recordType;
  if (recordType !== parsed.recordType) {
    return NextResponse.json({ error: "recordType mismatch" }, { status: 422 });
  }

  if (recordType === "registration") {
    await db
      .update(clientRegistrations)
      .set({ status: body.status })
      .where(eq(clientRegistrations.id, parsed.id));
  } else {
    await db
      .update(contactEnquiries)
      .set({ status: body.status })
      .where(eq(contactEnquiries.id, parsed.id));
  }

  return NextResponse.json({ ok: true, status: body.status });
}
