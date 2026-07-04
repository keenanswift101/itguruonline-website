import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { withTxDb } from "@/lib/db/tx";
import { clients, clientRegistrations, contactEnquiries } from "@/lib/db/schema";
import { parseCrmId } from "@/lib/crm-types";

export const dynamic = "force-dynamic";

/** Thrown inside the tx when the lead was already converted. */
class AlreadyConvertedError extends Error {}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = parseCrmId(id);
  if (!parsed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const client = await withTxDb((db) =>
      db.transaction(async (tx) => {
        if (parsed.recordType === "registration") {
          const [reg] = await tx
            .select()
            .from(clientRegistrations)
            .where(eq(clientRegistrations.id, parsed.id));
          if (!reg) throw new Error("NOT_FOUND");
          if (reg.convertedClientId) throw new AlreadyConvertedError();

          const [newClient] = await tx
            .insert(clients)
            .values({
              name: `${reg.firstName} ${reg.surname}`.trim(),
              email: reg.email,
              phone: reg.cellPhone,
              company: "",
              physicalAddress: reg.physicalAddress,
              postalAddress: reg.postalAddress,
              source: "from_registration",
              sourceRecordType: "registration",
              sourceRecordId: reg.id,
            })
            .returning();

          await tx
            .update(clientRegistrations)
            .set({ convertedClientId: newClient.id })
            .where(eq(clientRegistrations.id, reg.id));

          return newClient;
        } else {
          const [enq] = await tx
            .select()
            .from(contactEnquiries)
            .where(eq(contactEnquiries.id, parsed.id));
          if (!enq) throw new Error("NOT_FOUND");
          if (enq.convertedClientId) throw new AlreadyConvertedError();

          const [newClient] = await tx
            .insert(clients)
            .values({
              name: enq.name,
              email: enq.email,
              phone: enq.phone ?? "",
              company: "",
              physicalAddress: "",
              postalAddress: "",
              source: "from_enquiry",
              sourceRecordType: "enquiry",
              sourceRecordId: enq.id,
            })
            .returning();

          await tx
            .update(contactEnquiries)
            .set({ convertedClientId: newClient.id })
            .where(eq(contactEnquiries.id, enq.id));

          return newClient;
        }
      })
    );

    return NextResponse.json({ id: client.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AlreadyConvertedError) {
      return NextResponse.json({ error: "Lead already converted." }, { status: 409 });
    }
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }
}
