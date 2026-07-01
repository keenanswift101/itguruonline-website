import { db } from "@/lib/db/index";
import { clientRegistrations, contactEnquiries } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import type { CrmListItem } from "@/lib/crm-types";

/**
 * Queries both clientRegistrations and contactEnquiries tables, normalises the
 * fields into CrmListItem shape, and returns the merged list sorted by
 * createdAt descending (newest first).
 *
 * Shared by GET /api/admin/crm (list endpoint) and admin/crm/page.tsx (SSR)
 * so both always produce identical results from the same source of truth.
 */
export async function getMergedCrmRecords(): Promise<CrmListItem[]> {
  const [registrations, enquiries] = await Promise.all([
    db.select().from(clientRegistrations).orderBy(desc(clientRegistrations.createdAt)),
    db.select().from(contactEnquiries).orderBy(desc(contactEnquiries.createdAt)),
  ]);

  const items: CrmListItem[] = [
    ...registrations.map((r) => ({
      id: r.id,
      recordType: "registration" as const,
      name: `${r.firstName} ${r.surname}`.trim(),
      email: r.email,
      phone: r.cellPhone ?? "",
      status: r.status as CrmListItem["status"],
      createdAt: r.createdAt.toISOString(),
    })),
    ...enquiries.map((e) => ({
      id: e.id,
      recordType: "enquiry" as const,
      name: e.name,
      email: e.email,
      phone: e.phone ?? "",
      status: e.status as CrmListItem["status"],
      createdAt: e.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return items;
}
