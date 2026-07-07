import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { crmNotes } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getTicketById } from "@/lib/ticket-query";
import { STATUS_BADGE, PRIORITY_BADGE, type TicketStatus } from "@/lib/ticket-status";
import { TicketStatusSelect } from "@/components/admin/tickets/TicketStatusSelect";
import { TicketNoteForm } from "@/components/admin/tickets/TicketNoteForm";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ticket — IT-Guru Admin" };

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const ticket = await getTicketById(numId);
  if (!ticket) notFound();

  const notes = await db
    .select()
    .from(crmNotes)
    .where(and(eq(crmNotes.recordType, "ticket"), eq(crmNotes.recordId, numId)))
    .orderBy(asc(crmNotes.createdAt));

  const statusBadge = STATUS_BADGE[ticket.status] ?? STATUS_BADGE.open;
  const priorityBadge = PRIORITY_BADGE[ticket.priority] ?? PRIORITY_BADGE.medium;

  return (
    <main className="p-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/tickets"
        className="text-(--text-secondary) hover:text-(--text-primary) text-sm mb-6 inline-block"
      >
        &larr; Back to Tickets
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-(--text-primary) mb-1">{ticket.subject}</h1>
        <Link
          href={`/admin/clients/${ticket.clientId}`}
          className="text-sm text-(--text-secondary) hover:text-(--text-primary) underline"
        >
          {ticket.clientName}
        </Link>
      </div>

      {/* Details */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Details</h2>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge label={priorityBadge.label} className={priorityBadge.className} />
          <Badge label={statusBadge.label} className={statusBadge.className} />
          <TicketStatusSelect ticketId={ticket.id} current={ticket.status as TicketStatus} />
        </div>
        <p className="text-sm text-(--text-primary) whitespace-pre-wrap">
          {ticket.description || "No description."}
        </p>
      </Card>

      {/* Notes section */}
      <Card>
        <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Notes</h2>
        <TicketNoteForm ticketId={ticket.id} />

        <div className="mt-6 space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-(--text-secondary)">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="border-t border-(--border-color) pt-3 first:border-t-0 first:pt-0"
              >
                <p className="text-sm text-(--text-primary) whitespace-pre-wrap">{note.body}</p>
                <p className="text-xs text-(--text-secondary) mt-1">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
