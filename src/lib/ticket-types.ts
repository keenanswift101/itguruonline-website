import { z } from "zod";

export type TicketPriority = "low" | "medium" | "high";

/** Ticket row shaped for the list page (client name joined in). Serialization-safe. */
export interface TicketListItem {
  id: number;
  clientId: number;
  clientName: string;
  subject: string;
  priority: TicketPriority;
  status: string;
  createdAt: string; // ISO string — never a raw Date across the RSC boundary
  updatedAt: string;
}

/** Ticket row shaped for the client detail page's Tickets Card (CLIENT-06). */
export interface ClientTicketSummary {
  id: number;
  subject: string;
  priority: string;
  status: string;
}

export const CreateTicketSchema = z.object({
  clientId: z.number().int().positive(),
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high"]),
});

// Edit changes subject/description/priority only (NOT clientId, NOT status — status is
// its own transition-guarded PATCH route).
export const UpdateTicketSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high"]),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
