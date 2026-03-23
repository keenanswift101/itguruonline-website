"use client";

import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { StepAData } from "@/lib/registration-types";
import { validateStepA } from "@/lib/registration-validators";

interface StepAProps {
  data: StepAData;
  onNext: (data: StepAData) => void;
}

export function StepApplicantInfo({ data, onNext }: StepAProps) {
  const [fields, setFields] = useState<StepAData>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sameAsPhysical, setSameAsPhysical] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  }

  function handleSameAsPhysical(checked: boolean) {
    setSameAsPhysical(checked);
    if (checked) setFields((prev) => ({ ...prev, postalAddress: prev.physicalAddress }));
    else setFields((prev) => ({ ...prev, postalAddress: "" }));
  }

  function handleNext() {
    const errs = validateStepA(fields);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext(fields);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Section A — Applicant Information</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Tell us about yourself. All fields marked * are required.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="firstName">
            First Name <span className="text-error">*</span>
          </label>
          <input
            id="firstName" name="firstName" type="text" autoComplete="given-name"
            value={fields.firstName} onChange={handleChange}
            className={`h-10 w-full rounded-lg border px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.firstName ? "ring-2 ring-error border-error" : ""}`}
          />
          {errors.firstName && <p className="mt-1 text-xs text-error">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="surname">
            Surname <span className="text-error">*</span>
          </label>
          <input
            id="surname" name="surname" type="text" autoComplete="family-name"
            value={fields.surname} onChange={handleChange}
            className={`h-10 w-full rounded-lg border px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.surname ? "ring-2 ring-error border-error" : ""}`}
          />
          {errors.surname && <p className="mt-1 text-xs text-error">{errors.surname}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="idPassport">
          SA ID / Passport Number <span className="text-error">*</span>
        </label>
        <input
          id="idPassport" name="idPassport" type="text" autoComplete="off"
          placeholder="13-digit SA ID or passport number"
          value={fields.idPassport} onChange={handleChange}
          className={`h-10 w-full rounded-lg border px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.idPassport ? "ring-2 ring-error border-error" : ""}`}
        />
        {errors.idPassport && <p className="mt-1 text-xs text-error">{errors.idPassport}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="physicalAddress">
          Physical Address <span className="text-error">*</span>
        </label>
        <textarea
          id="physicalAddress" name="physicalAddress" rows={3} autoComplete="street-address"
          placeholder="Street address, suburb, city, postal code"
          value={fields.physicalAddress}
          onChange={(e) => {
            handleChange(e);
            if (sameAsPhysical) setFields((prev) => ({ ...prev, postalAddress: e.target.value }));
          }}
          className={`w-full rounded-lg border px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${errors.physicalAddress ? "ring-2 ring-error border-error" : ""}`}
        />
        {errors.physicalAddress && <p className="mt-1 text-xs text-error">{errors.physicalAddress}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-[var(--text-primary)]" htmlFor="postalAddress">
            Postal Address
          </label>
          <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox" className="rounded accent-primary-700"
              checked={sameAsPhysical}
              onChange={(e) => handleSameAsPhysical(e.target.checked)}
            />
            Same as physical
          </label>
        </div>
        <textarea
          id="postalAddress" name="postalAddress" rows={3}
          placeholder="Leave blank if same as physical address"
          value={sameAsPhysical ? fields.physicalAddress : fields.postalAddress}
          onChange={handleChange}
          disabled={sameAsPhysical}
          className="w-full rounded-lg border px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="cellPhone">
            Cell Phone <span className="text-error">*</span>
          </label>
          <input
            id="cellPhone" name="cellPhone" type="tel" autoComplete="tel"
            placeholder="072 962 7608"
            value={fields.cellPhone} onChange={handleChange}
            className={`h-10 w-full rounded-lg border px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.cellPhone ? "ring-2 ring-error border-error" : ""}`}
          />
          {errors.cellPhone && <p className="mt-1 text-xs text-error">{errors.cellPhone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="telephone">
            Telephone (Landline)
          </label>
          <input
            id="telephone" name="telephone" type="tel"
            placeholder="021 000 0000"
            value={fields.telephone} onChange={handleChange}
            className={`h-10 w-full rounded-lg border px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.telephone ? "ring-2 ring-error border-error" : ""}`}
          />
          {errors.telephone && <p className="mt-1 text-xs text-error">{errors.telephone}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="email">
          Email Address <span className="text-error">*</span>
        </label>
        <input
          id="email" name="email" type="email" autoComplete="email"
          placeholder="you@example.com"
          value={fields.email} onChange={handleChange}
          className={`h-10 w-full rounded-lg border px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.email ? "ring-2 ring-error border-error" : ""}`}
        />
        {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleNext} size="lg">
          Continue →
        </Button>
      </div>
    </div>
  );
}
