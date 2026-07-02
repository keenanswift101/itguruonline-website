"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { StepCData } from "@/lib/registration-types";
import type { HostingPackageDTO } from "@/lib/pricing";
import { validateStepC } from "@/lib/registration-validators";

interface StepCProps {
  data: StepCData;
  packages: HostingPackageDTO[];
  onNext: (data: StepCData) => void;
  onBack: () => void;
}

const ADDONS = [
  { key: "domainRegistration" as const, label: "Domain Registration", desc: "Register your chosen domain name", price: "From R 150/yr" },
  { key: "sslCertificate" as const, label: "SSL Certificate", desc: "Secure your site with HTTPS", price: "Free with hosting" },
  { key: "emailHosting" as const, label: "Email Hosting", desc: "Professional business email accounts", price: "Included in package" },
  { key: "websiteDesign" as const, label: "Website Design", desc: "Professional website design and development", price: "Quote provided" },
];

export function StepServiceSelection({ data, packages, onNext, onBack }: StepCProps) {
  const [fields, setFields] = useState<StepCData>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function selectPackage(pkg: string) {
    setFields((prev) => ({ ...prev, hostingPackage: pkg }));
    if (errors.hostingPackage) setErrors((prev) => { const next = { ...prev }; delete next.hostingPackage; return next; });
  }

  function toggleAddon(key: keyof Pick<StepCData, "domainRegistration" | "sslCertificate" | "emailHosting" | "websiteDesign">) {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleNext() {
    const errs = validateStepC(fields);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext(fields);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-(--text-primary)">Section C — Service Selection</h2>
        <p className="mt-1 text-sm text-(--text-secondary)">Choose your hosting package and any additional services.</p>
      </div>

      {/* Hosting package selection */}
      <div>
        <p className="text-sm font-semibold text-(--text-primary) mb-3" id="hosting-pkg-label">
          Web Hosting Package <span className="text-error">*</span>
        </p>
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          role="radiogroup"
          aria-labelledby="hosting-pkg-label"
        >
          {packages.map((pkg) => {
            const selected = fields.hostingPackage === pkg.slug;
            return (
              <button
                key={pkg.slug}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => selectPackage(pkg.slug)}
                className={`text-left rounded-xl border-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer ${
                  selected
                    ? "border-primary-700 bg-primary-50/60 dark:bg-primary-900/20"
                    : "border-(--border-color) bg-(--bg-primary) hover:border-primary-300 dark:hover:border-primary-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-(--text-primary)">{pkg.name}</p>
                    <p className="text-primary-700 font-bold mt-0.5">R{pkg.priceRands}/{pkg.pricePeriod}</p>
                  </div>
                  <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected ? "border-primary-700 bg-primary-700" : "border-(--border-color)"
                  }`}>
                    {selected && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <ul className="mt-3 space-y-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="text-xs text-(--text-secondary) flex items-center gap-1.5">
                      <span className="text-primary-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
        {errors.hostingPackage && <p className="mt-2 text-xs text-error">{errors.hostingPackage}</p>}
      </div>

      {/* Add-ons */}
      <div>
        <p className="text-sm font-semibold text-(--text-primary) mb-3">Add-on Services</p>
        <div className="space-y-2">
          {ADDONS.map((addon) => {
            const checked = fields[addon.key];
            return (
              <label
                key={addon.key}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  checked
                    ? "border-primary-300 bg-primary-50/40 dark:border-primary-700/50 dark:bg-primary-900/10"
                    : "border-(--border-color) hover:bg-(--bg-surface)"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded accent-primary-700 cursor-pointer"
                  checked={checked}
                  onChange={() => toggleAddon(addon.key)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-(--text-primary)">{addon.label}</p>
                  <p className="text-xs text-(--text-secondary)">{addon.desc}</p>
                </div>
                <span className="text-xs font-medium text-primary-700 shrink-0">{addon.price}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Additional notes */}
      <div>
        <label className="block text-sm font-medium text-(--text-primary) mb-1" htmlFor="additionalServices">
          Additional Notes / Requests
        </label>
        <textarea
          id="additionalServices"
          name="additionalServices"
          rows={3}
          placeholder="Any specific requirements or questions for IT-Guru Online..."
          value={fields.additionalServices}
          onChange={(e) => setFields((prev) => ({ ...prev, additionalServices: e.target.value }))}
          className="w-full rounded-lg border px-3 py-2 bg-(--bg-primary) text-(--text-primary) border-(--border-color) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext} size="lg">Continue →</Button>
      </div>
    </div>
  );
}
