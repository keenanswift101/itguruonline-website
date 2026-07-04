import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { clientRegistrations, contactEnquiries, crmNotes } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { parseCrmId } from "@/lib/crm-types";
import { Card } from "@/components/ui/Card";
import { StatusSelect } from "@/components/admin/crm/StatusSelect";
import { NoteForm } from "@/components/admin/crm/NoteForm";
import { ConvertButton } from "@/components/admin/crm/ConvertButton";

export const metadata = { title: "CRM Record — IT-Guru Admin" };

export default async function CrmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const parsed = parseCrmId(id);
  if (!parsed) notFound();

  let record: typeof clientRegistrations.$inferSelect | typeof contactEnquiries.$inferSelect | undefined;

  if (parsed.recordType === "registration") {
    const [row] = await db
      .select()
      .from(clientRegistrations)
      .where(eq(clientRegistrations.id, parsed.id));
    record = row;
  } else {
    const [row] = await db
      .select()
      .from(contactEnquiries)
      .where(eq(contactEnquiries.id, parsed.id));
    record = row;
  }

  if (!record) notFound();

  const notes = await db
    .select()
    .from(crmNotes)
    .where(and(eq(crmNotes.recordType, parsed.recordType), eq(crmNotes.recordId, parsed.id)))
    .orderBy(asc(crmNotes.createdAt));

  const isRegistration = parsed.recordType === "registration";
  const reg = isRegistration ? (record as typeof clientRegistrations.$inferSelect) : null;
  const enq = !isRegistration ? (record as typeof contactEnquiries.$inferSelect) : null;

  const displayName = isRegistration && reg
    ? `${reg.firstName} ${reg.surname}`.trim()
    : enq?.name ?? "";

  return (
    <main className="p-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/crm"
        className="text-(--text-secondary) hover:text-(--text-primary) text-sm mb-6 inline-block"
      >
        &larr; Back to CRM
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-(--text-primary) mb-1">{displayName}</h1>
        {isRegistration && reg && (
          <p className="text-sm text-(--text-secondary) font-mono">
            Ref: <span className="font-semibold text-(--text-primary)">{reg.referenceId}</span>
          </p>
        )}
        <div className="mt-4 flex items-center gap-4">
          <StatusSelect
            recordType={parsed.recordType}
            recordId={parsed.id}
            current={record.status}
          />
          <ConvertButton
            recordType={parsed.recordType}
            recordId={parsed.id}
            convertedClientId={record.convertedClientId ?? null}
          />
        </div>
      </div>

      {/* Details */}
      {isRegistration && reg ? (
        <>
          {/* Personal info */}
          <Card className="mb-4">
            <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Personal Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-(--text-secondary)">Email</dt>
                <dd className="text-(--text-primary)">{reg.email}</dd>
              </div>
              <div>
                <dt className="text-(--text-secondary)">Cell Phone</dt>
                <dd className="text-(--text-primary)">{reg.cellPhone}</dd>
              </div>
              {reg.telephone && (
                <div>
                  <dt className="text-(--text-secondary)">Telephone</dt>
                  <dd className="text-(--text-primary)">{reg.telephone}</dd>
                </div>
              )}
              <div>
                <dt className="text-(--text-secondary)">Physical Address</dt>
                <dd className="text-(--text-primary) whitespace-pre-line">{reg.physicalAddress}</dd>
              </div>
              {reg.postalAddress && (
                <div>
                  <dt className="text-(--text-secondary)">Postal Address</dt>
                  <dd className="text-(--text-primary) whitespace-pre-line">{reg.postalAddress}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Domain */}
          <Card className="mb-4">
            <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Domain</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-(--text-secondary)">Domain Name</dt>
                <dd className="text-(--text-primary) font-mono">{reg.domainName}</dd>
              </div>
              {reg.nameserver1 && (
                <div>
                  <dt className="text-(--text-secondary)">Nameserver 1</dt>
                  <dd className="text-(--text-primary) font-mono">{reg.nameserver1}</dd>
                </div>
              )}
              {reg.nameserver2 && (
                <div>
                  <dt className="text-(--text-secondary)">Nameserver 2</dt>
                  <dd className="text-(--text-primary) font-mono">{reg.nameserver2}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Package & Add-ons */}
          <Card className="mb-4">
            <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Package &amp; Add-ons</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-(--text-secondary)">Hosting Package</dt>
                <dd className="text-(--text-primary)">{reg.hostingPackage}</dd>
              </div>
              <div>
                <dt className="text-(--text-secondary)">Domain Registration</dt>
                <dd className="text-(--text-primary)">{reg.domainRegistration ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-(--text-secondary)">SSL Certificate</dt>
                <dd className="text-(--text-primary)">{reg.sslCertificate ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-(--text-secondary)">Email Hosting</dt>
                <dd className="text-(--text-primary)">{reg.emailHosting ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-(--text-secondary)">Website Design</dt>
                <dd className="text-(--text-primary)">{reg.websiteDesign ? "Yes" : "No"}</dd>
              </div>
              {reg.additionalServices && (
                <div className="col-span-2">
                  <dt className="text-(--text-secondary)">Additional Services</dt>
                  <dd className="text-(--text-primary) whitespace-pre-line">{reg.additionalServices}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Declaration */}
          <Card className="mb-8">
            <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Declaration</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-(--text-secondary)">Signature</dt>
                <dd className="text-(--text-primary) italic">{reg.signature}</dd>
              </div>
              <div>
                <dt className="text-(--text-secondary)">Signature Date</dt>
                <dd className="text-(--text-primary)">{reg.signatureDate}</dd>
              </div>
              <div>
                <dt className="text-(--text-secondary)">Terms Accepted</dt>
                <dd className="text-(--text-primary)">{reg.termsAccepted ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-(--text-secondary)">Submitted</dt>
                <dd className="text-(--text-primary)">{new Date(reg.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
          </Card>
        </>
      ) : enq ? (
        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Enquiry Details</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-(--text-secondary)">Email</dt>
              <dd className="text-(--text-primary)">{enq.email}</dd>
            </div>
            {enq.phone && (
              <div>
                <dt className="text-(--text-secondary)">Phone</dt>
                <dd className="text-(--text-primary)">{enq.phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-(--text-secondary)">Subject</dt>
              <dd className="text-(--text-primary) font-semibold">{enq.subject}</dd>
            </div>
            <div>
              <dt className="text-(--text-secondary)">Message</dt>
              <dd className="text-(--text-primary) whitespace-pre-line">{enq.message}</dd>
            </div>
            <div>
              <dt className="text-(--text-secondary)">Submitted</dt>
              <dd className="text-(--text-primary)">{new Date(enq.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </Card>
      ) : null}

      {/* Notes section */}
      <Card>
        <h2 className="text-lg font-semibold text-(--text-primary) mb-4">Notes</h2>
        <NoteForm recordType={parsed.recordType} recordId={parsed.id} />

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
