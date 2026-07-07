import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { tickets, clients } from "@/lib/db/schema";
import { getTickets } from "@/lib/ticket-query";
import { CreateTicketSchema } from "@/lib/ticket-types";
import type { TicketStatus } from "@/lib/ticket-status";

export const dynamic = "force-dynamic";

const FILTERABLE = ["open", "in_progress", "resolved"] as const;

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statusParam = req.nextUrl.searchParams.get("status");
  const statusFilter = FILTERABLE.find((s) => s === statusParam) as TicketStatus | undefined;
  const items = await getTickets(statusFilter);
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

  const parsed = CreateTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const d = parsed.data;

  // Client-existence pre-check (plain select, single-insert so no tx) — mirrors 08-02.
  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, d.clientId));
  if (!client) {
    return NextResponse.json(
      { error: "Validation failed.", fields: { clientId: ["That client no longer exists."] } },
      { status: 422 }
    );
  }

  const [ticket] = await db
    .insert(tickets)
    .values({
      clientId: d.clientId,
      subject: d.subject,
      description: d.description ?? "",
      priority: d.priority,
      status: "open",
    })
    .returning({ id: tickets.id });

  return NextResponse.json({ id: ticket.id }, { status: 201 });
}
