import { db } from "@/lib/db/index";
import { clients, invoices } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatInvoiceNumber } from "@/lib/invoices";
import type {
  ClientInvoiceSummary,
  ClientListItem,
  ClientPickerOption,
  ClientSource,
} from "@/lib/client-types";

/**
 * List all clients, newest first, as serialization-safe list items.
 *
 * Shared by GET /api/admin/clients (list endpoint) and admin/clients/page.tsx
 * (SSR, added in 06-03) so both always produce identical results from the
 * same source of truth — don't re-inline this query (see the crm/route.ts
 * duplication this pattern is explicitly avoiding).
 */
export async function getClients(): Promise<ClientListItem[]> {
  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    source: c.source as ClientSource,
    createdAt: c.createdAt.toISOString(),
  }));
}

/** Full client row for the detail/edit page, or null if not found. */
export async function getClientById(id: number) {
  const [row] = await db.select().from(clients).where(eq(clients.id, id));
  return row ?? null;
}

/**
 * Client rows shaped for the invoice/quotation client picker (INVOICE-09).
 * Includes address fields so the form can auto-fill billing address on select.
 */
export async function getClientsForPicker(): Promise<ClientPickerOption[]> {
  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    company: c.company,
    physicalAddress: c.physicalAddress,
    postalAddress: c.postalAddress,
  }));
}

/**
 * Invoices linked to a client via invoices.client_id (CLIENT-06), newest first.
 * Serialization-safe (no raw Date fields) — issue/due dates are Postgres DATE
 * columns that Drizzle already returns as plain strings.
 */
export async function getClientInvoices(clientId: number): Promise<ClientInvoiceSummary[]> {
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, clientId))
    .orderBy(desc(invoices.createdAt));
  return rows.map((inv) => ({
    id: inv.id,
    invoiceNumber: formatInvoiceNumber(inv.fiscalYear, inv.sequenceNumber),
    status: inv.status,
    totalRands: inv.totalRands,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
  }));
}
