import { db } from "@/lib/db/index";
import { tickets, clients } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import type {
  TicketListItem,
  ClientTicketSummary,
  TicketPriority,
} from "@/lib/ticket-types";
import type { TicketStatus } from "@/lib/ticket-status";

// Sort keys shared by list + client-detail: resolved sinks to the bottom,
// then high→medium→low priority, then most-recently-updated.
const RESOLVED_LAST = sql`CASE ${tickets.status} WHEN 'resolved' THEN 1 ELSE 0 END`;
const PRIORITY_RANK = sql`CASE ${tickets.priority} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`;

/**
 * All tickets (optionally filtered by status), shaped as serialization-safe
 * list items with the client name joined. Open/in_progress surface before
 * resolved (TICKET-04), then priority desc, then most-recently-updated.
 */
export async function getTickets(statusFilter?: TicketStatus): Promise<TicketListItem[]> {
  const base = db
    .select({
      id: tickets.id,
      clientId: tickets.clientId,
      clientName: clients.name,
      subject: tickets.subject,
      priority: tickets.priority,
      status: tickets.status,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .innerJoin(clients, eq(tickets.clientId, clients.id));

  const rows = await (statusFilter
    ? base.where(eq(tickets.status, statusFilter)).orderBy(PRIORITY_RANK, desc(tickets.updatedAt))
    : base.orderBy(RESOLVED_LAST, PRIORITY_RANK, desc(tickets.updatedAt)));

  return rows.map((t) => ({
    id: t.id,
    clientId: t.clientId,
    clientName: t.clientName,
    subject: t.subject,
    priority: t.priority as TicketPriority,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
}

/** Full ticket joined to its client, for the detail page. Null if not found. */
export async function getTicketById(id: number) {
  const [row] = await db
    .select({
      id: tickets.id,
      clientId: tickets.clientId,
      clientName: clients.name,
      subject: tickets.subject,
      description: tickets.description,
      priority: tickets.priority,
      status: tickets.status,
      resolvedAt: tickets.resolvedAt,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .innerJoin(clients, eq(tickets.clientId, clients.id))
    .where(eq(tickets.id, id));
  return row ?? null;
}

/** Tickets for one client (CLIENT-06 seam), resolved last, most-recent first. */
export async function getClientTickets(clientId: number): Promise<ClientTicketSummary[]> {
  const rows = await db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      priority: tickets.priority,
      status: tickets.status,
    })
    .from(tickets)
    .where(eq(tickets.clientId, clientId))
    .orderBy(RESOLVED_LAST, desc(tickets.updatedAt));
  return rows;
}
