"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PackageOption {
  id: number;
  name: string;
  priceRands: number;
}

interface AddScheduleFormProps {
  packages: PackageOption[];
}

type FieldErrors = Record<string, string[]>;

export function AddScheduleForm({ packages }: AddScheduleFormProps) {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [packageId, setPackageId] = useState<string>(
    packages[0] ? String(packages[0].id) : ""
  );
  const [billingStart, setBillingStart] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    try {
      const res = await fetch("/api/admin/billing-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail: clientEmail || undefined,
          packageId: packageId ? Number(packageId) : undefined,
          billingStart,
          cycle: "monthly",
        }),
      });

      if (res.status === 201) {
        setClientName("");
        setClientEmail("");
        setBillingStart("");
        router.refresh();
        return;
      }

      const data = await res.json();
      if (res.status === 422 && data.fields) {
        setErrors(data.fields as FieldErrors);
      } else {
        setFormError(data.error ?? "Failed to create billing schedule.");
      }
    } catch {
      setFormError("Failed to create billing schedule.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Add billing schedule"
      className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-5"
    >
      <h3 className="text-sm font-semibold text-(--text-primary) mb-4">Add Billing Schedule</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label htmlFor="client-name" className="block text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
            Client Name
          </label>
          <input
            id="client-name"
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          {errors.clientName && (
            <p className="text-xs text-red-400">{errors.clientName[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="client-email" className="block text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
            Client Email (optional)
          </label>
          <input
            id="client-email"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          {errors.clientEmail && (
            <p className="text-xs text-red-400">{errors.clientEmail[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="package-id" className="block text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
            Package
          </label>
          <select
            id="package-id"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="w-full rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) scheme-dark focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            <option value="" className="bg-(--bg-primary) text-(--text-primary)">— None —</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id} className="bg-(--bg-primary) text-(--text-primary)">
                {pkg.name} (R{pkg.priceRands}/mo)
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="billing-start" className="block text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
            Billing Start
          </label>
          <input
            id="billing-start"
            type="date"
            required
            value={billingStart}
            onChange={(e) => setBillingStart(e.target.value)}
            className="w-full rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          {errors.billingStart && (
            <p className="text-xs text-red-400">{errors.billingStart[0]}</p>
          )}
        </div>
      </div>

      {formError && <p className="mt-3 text-sm text-red-400">{formError}</p>}

      <div className="mt-4">
        <button type="submit" disabled={submitting} className="btn-metallic text-sm px-4 py-2 disabled:opacity-50">
          {submitting ? "Adding…" : "Add Schedule"}
        </button>
      </div>
    </form>
  );
}
