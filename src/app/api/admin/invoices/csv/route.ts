import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { invoices } from "@/lib/db/schema";
import { formatInvoiceNumber } from "@/lib/invoices";

export const dynamic = "force-dynamic";

const FILTERABLE_STATUSES = ["draft", "sent", "paid"] as const;

const HEADER_ROW =
  "Invoice #,Client Name,Client Email,Issue Date,Due Date,Total (R),Status,Paid At";

/** RFC 4180 escaping — quote + double inner quotes when needed (Phase 2 CRM-07 pattern). */
function csvEscape(val: string | number | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const statusParam = new URL(req.url).searchParams.get("status");
  const statusFilter = FILTERABLE_STATUSES.find((s) => s === statusParam);

  const base = db.select().from(invoices);
  const rows = await (statusFilter
    ? base.where(eq(invoices.status, statusFilter)).orderBy(desc(invoices.createdAt))
    : base.orderBy(desc(invoices.createdAt)));

  const lines = rows.map((inv) =>
    [
      formatInvoiceNumber(inv.fiscalYear, inv.sequenceNumber),
      csvEscape(inv.clientName),
      csvEscape(inv.clientEmail ?? ""),
      inv.issueDate,
      inv.dueDate,
      inv.totalRands,
      inv.status,
      inv.paidAt ? new Date(inv.paidAt).toISOString() : "",
    ].join(",")
  );

  const csv = [HEADER_ROW, ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="invoices.csv"',
    },
  });
}
