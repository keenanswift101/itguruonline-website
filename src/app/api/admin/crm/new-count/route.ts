import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { clientRegistrations, contactEnquiries } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [[regs], [enqs]] = await Promise.all([
    db
      .select({ value: count() })
      .from(clientRegistrations)
      .where(eq(clientRegistrations.status, "new")),
    db
      .select({ value: count() })
      .from(contactEnquiries)
      .where(eq(contactEnquiries.status, "new")),
  ]);

  const registrations = regs?.value ?? 0;
  const enquiries = enqs?.value ?? 0;

  return NextResponse.json({
    registrations,
    enquiries,
    total: registrations + enquiries,
  });
}
