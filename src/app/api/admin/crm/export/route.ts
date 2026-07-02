import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { clientRegistrations, contactEnquiries } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { csvRow } from "@/lib/csv";

const HEADER = [
  "ID",
  "Type",
  "Name",
  "Email",
  "Phone",
  "Status",
  "Submitted Date",
  "Domain",
  "Package",
  "Add-ons",
  "Subject",
  "Message",
];

type Registration = InferSelectModel<typeof clientRegistrations>;
type Enquiry = InferSelectModel<typeof contactEnquiries>;

/**
 * Build the CSV body from registration and enquiry rows.
 * Exported for unit testing without DB/auth.
 */
export function buildCsvBody(
  registrations: Registration[],
  enquiries: Enquiry[]
): string {
  const regRows = registrations.map((r) => {
    const addons = [
      r.domainRegistration && "Domain Registration",
      r.sslCertificate && "SSL Certificate",
      r.emailHosting && "Email Hosting",
      r.websiteDesign && "Website Design",
    ]
      .filter(Boolean)
      .join("; ");

    return csvRow([
      r.id,
      "Registration",
      `${r.firstName} ${r.surname}`.trim(),
      r.email,
      r.cellPhone,
      r.status,
      r.createdAt.toISOString().split("T")[0],
      r.domainName,
      r.hostingPackage,
      addons,
      "",
      "",
    ]);
  });

  const enqRows = enquiries.map((e) =>
    csvRow([
      e.id,
      "Enquiry",
      e.name,
      e.email,
      e.phone ?? "",
      e.status,
      e.createdAt.toISOString().split("T")[0],
      "",
      "",
      "",
      e.subject,
      e.message,
    ])
  );

  return [csvRow(HEADER), ...regRows, ...enqRows].join("\r\n");
}

export async function GET(_req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [registrations, enquiries] = await Promise.all([
    db
      .select()
      .from(clientRegistrations)
      .orderBy(desc(clientRegistrations.createdAt)),
    db
      .select()
      .from(contactEnquiries)
      .orderBy(desc(contactEnquiries.createdAt)),
  ]);

  const csv = buildCsvBody(registrations, enquiries);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="crm-export.csv"',
    },
  });
}
