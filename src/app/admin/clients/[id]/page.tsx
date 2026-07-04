import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { crmNotes } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getClientById } from "@/lib/client-query";
import ClientForm from "@/components/forms/ClientForm";
import { ClientNoteForm } from "@/components/admin/clients/ClientNoteForm";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client — IT-Guru Admin" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const client = await getClientById(numId);
  if (!client) notFound();

  const notes = await db
    .select()
    .from(crmNotes)
    .where(and(eq(crmNotes.recordType, "client"), eq(crmNotes.recordId, numId)))
    .orderBy(asc(crmNotes.createdAt));

  return (
    <main className="p-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/clients"
        className="text-(--text-secondary) hover:text-(--text-primary) text-sm mb-6 inline-block"
      >
        &larr; Back to Clients
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-(--text-primary) mb-1">{client.name}</h1>
        <div className="mt-2 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-(--border-color) px-3 py-1 text-xs text-(--text-secondary)">
            {client.source === "manual"
              ? "Manual"
              : client.source === "from_registration"
                ? "From registration"
                : "From enquiry"}
          </span>
          {client.sourceRecordType && client.sourceRecordId != null && (
            <Link
              href={`/admin/crm/${client.sourceRecordType}-${client.sourceRecordId}`}
              className="text-sm text-(--text-secondary) hover:text-(--text-primary) underline"
            >
              Originating lead
            </Link>
          )}
        </div>
      </div>

      {/* Edit details */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Edit Details</h2>
        <ClientForm
          clientId={client.id}
          initial={{
            name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
            physicalAddress: client.physicalAddress,
            postalAddress: client.postalAddress,
          }}
        />
      </Card>

      {/* Notes section */}
      <Card>
        <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Notes</h2>
        <ClientNoteForm clientId={client.id} />

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
