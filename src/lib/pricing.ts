import { db } from "@/lib/db/index";
import { hostingPackages, domainPrices, siteSettings } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type HostingPackageRow = InferSelectModel<typeof hostingPackages>;

/** Serializable subset safe to pass server -> client (no Date fields). */
export interface HostingPackageDTO {
  id: number;
  slug: string;
  name: string;
  priceRands: number;
  pricePeriod: string;
  description: string;
  features: string[]; // split from newline-separated TEXT
  isPopular: boolean;
  sortOrder: number;
}

export async function getHostingPackages(): Promise<HostingPackageDTO[]> {
  const rows = await db.select().from(hostingPackages).orderBy(asc(hostingPackages.sortOrder));
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    priceRands: r.priceRands,
    pricePeriod: r.pricePeriod,
    description: r.description,
    features: r.features ? r.features.split("\n").filter(Boolean) : [],
    isPopular: r.isPopular,
    sortOrder: r.sortOrder,
  }));
}

/** tld -> price (rands) or null. JSON-serializable for client props. */
export async function getDomainPriceMap(): Promise<Record<string, number | null>> {
  const rows = await db.select().from(domainPrices);
  return Object.fromEntries(rows.map((r) => [r.tld, r.priceRands ?? null]));
}

/** key -> value map for site_settings. */
export async function getSiteSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(siteSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
