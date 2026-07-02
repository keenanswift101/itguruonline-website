import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getHostingPackages, getDomainPriceMap, getSiteSettings } from "@/lib/pricing";
import { PricingPackagesTable } from "./PricingPackagesTable";
import { DomainPricesTable } from "./DomainPricesTable";
import { SiteSettingsForm } from "./SiteSettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Pricing" };

export default async function AdminPricingPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const [packages, domainPrices, settings] = await Promise.all([
    getHostingPackages(),
    getDomainPriceMap(),
    getSiteSettings(),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8 space-y-10">
      <header>
        <h1 className="text-2xl font-bold text-(--text-primary)">Pricing</h1>
        <p className="text-(--text-secondary) text-sm mt-1">
          Edits auto-save on blur and appear on the public site on its next page load.
        </p>
      </header>

      <section aria-label="Hosting packages" className="space-y-3">
        <h2 className="text-lg font-semibold text-(--text-primary)">Hosting Packages</h2>
        <PricingPackagesTable packages={packages} />
      </section>

      <section aria-label="Domain prices" className="space-y-3">
        <h2 className="text-lg font-semibold text-(--text-primary)">Domain Prices</h2>
        <DomainPricesTable domainPrices={domainPrices} />
      </section>

      <section aria-label="Site settings" className="space-y-3">
        <h2 className="text-lg font-semibold text-(--text-primary)">Site Settings</h2>
        <SiteSettingsForm settings={settings} />
      </section>
    </main>
  );
}
