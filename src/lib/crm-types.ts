export const CRM_STATUSES = ["new", "contacted", "in_progress", "completed"] as const;
export type CrmStatus = (typeof CRM_STATUSES)[number];
export type CrmRecordType = "registration" | "enquiry";

export interface CrmListItem {
  id: number;
  recordType: CrmRecordType;
  name: string; // normalised: firstName + " " + surname (reg) OR name (enquiry)
  email: string;
  phone: string; // cellPhone (reg) OR phone ?? "" (enquiry)
  status: CrmStatus;
  createdAt: string; // ISO string
}

// Prefixed URL id used by list links + detail route parsing.
export function encodeCrmId(recordType: CrmRecordType, id: number): string {
  return `${recordType}-${id}`;
}

export function parseCrmId(param: string): { recordType: CrmRecordType; id: number } | null {
  const m = /^(registration|enquiry)-(\d+)$/.exec(param);
  if (!m) return null;
  return { recordType: m[1] as CrmRecordType, id: Number(m[2]) };
}

export const STATUS_LABELS: Record<CrmStatus, string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In Progress",
  completed: "Completed",
};
