import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { clients } from "@/lib/db/schema";
import { getClients } from "@/lib/client-query";
import { CreateClientSchema } from "@/lib/client-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getClients();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = CreateClientSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const d = parsed.data;
  const [client] = await db
    .insert(clients)
    .values({
      name: d.name,
      email: d.email,
      phone: d.phone ?? "",
      company: d.company ?? "",
      physicalAddress: d.physicalAddress ?? "",
      postalAddress: d.postalAddress ?? "",
      source: "manual",
    })
    .returning();

  return NextResponse.json({ id: client.id }, { status: 201 });
}
