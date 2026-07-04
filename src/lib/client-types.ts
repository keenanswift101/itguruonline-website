import { z } from "zod";

export type ClientSource = "manual" | "from_registration" | "from_enquiry";

export interface ClientListItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: ClientSource;
  createdAt: string; // ISO string — never a raw Date across the RSC boundary
}

export const CreateClientSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  physicalAddress: z.string().trim().max(5000).optional().or(z.literal("")),
  postalAddress: z.string().trim().max(5000).optional().or(z.literal("")),
});

// Edit uses the same field rules as create (clients have no status lifecycle lock).
export const UpdateClientSchema = CreateClientSchema;

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
