"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { StepAData } from "@/lib/registration-types";
import { validateStepA } from "@/lib/registration-validators";

interface StepAProps {
  data: StepAData;
  onNext: (data: StepAData) => void;
}

const COUNTRY_CODES = [
  { code: "+27", country: "South Africa", iso2: "za" },
  { code: "+264", country: "Namibia", iso2: "na" },
  { code: "+267", country: "Botswana", iso2: "bw" },
  { code: "+263", country: "Zimbabwe", iso2: "zw" },
  { code: "+258", country: "Mozambique", iso2: "mz" },
  { code: "+266", country: "Lesotho", iso2: "ls" },
  { code: "+268", country: "Eswatini", iso2: "sz" },
  { code: "+234", country: "Nigeria", iso2: "ng" },
  { code: "+254", country: "Kenya", iso2: "ke" },
  { code: "+233", country: "Ghana", iso2: "gh" },
  { code: "+44", country: "United Kingdom", iso2: "gb" },
  { code: "+1", country: "USA / Canada", iso2: "us" },
  { code: "+61", country: "Australia", iso2: "au" },
  { code: "+49", country: "Germany", iso2: "de" },
  { code: "+33", country: "France", iso2: "fr" },
  { code: "+91", country: "India", iso2: "in" },
  { code: "+971", country: "UAE", iso2: "ae" },
];

/** Split a stored "+27821234567" value into { code, local } using the longest matching prefix. */
function splitPhone(value: string): { code: string; local: string } {
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const { code } of sorted) {
    if (value.startsWith(code)) return { code, local: value.slice(code.length).trim() };
  }
  return { code: "+27", local: value.replace(/^\+?27|^0/, "").trim() };
}

function FlagImg({ iso2, className = "" }: { iso2: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/24x18/${iso2}.png`}
      alt=""
      width={20}
      height={15}
      className={`inline-block shrink-0 rounded-[2px] object-cover ${className}`}
      aria-hidden="true"
    />
  );
}

function CountryCodeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = COUNTRY_CODES.find((c) => c.code === value) ?? COUNTRY_CODES[0];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Country code"
        className="flex h-10 items-center gap-1.5 rounded-lg border px-2 bg-(--bg-primary) text-(--text-primary) border-(--border-color) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <FlagImg iso2={selected.iso2} />
        <span className="text-sm">{selected.code}</span>
        <svg className="h-3.5 w-3.5 text-(--text-secondary)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border bg-(--bg-primary) border-(--border-color) py-1 shadow-xl"
        >
          {COUNTRY_CODES.map((c) => (
            <li key={c.code} role="option" aria-selected={c.code === value}>
              <button
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-(--bg-surface) ${
                  c.code === value ? "bg-(--bg-surface)" : ""
                }`}
              >
                <FlagImg iso2={c.iso2} />
                <span className="text-(--text-primary)">{c.country}</span>
                <span className="ml-auto text-(--text-secondary)">{c.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StepApplicantInfo({ data, onNext }: StepAProps) {
  const [fields, setFields] = useState<StepAData>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sameAsPhysical, setSameAsPhysical] = useState(false);
  const initialPhone = splitPhone(data.cellPhone);
  const [cellCountryCode, setCellCountryCode] = useState(initialPhone.code);
  const [cellLocalNumber, setCellLocalNumber] = useState(initialPhone.local);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  }

  function handleCellPhoneChange(nextCode: string, rawLocal: string) {
    // Browser autofill sometimes fills the local-number field with the full
    // international number (e.g. "+27729627608") instead of just the local
    // part. Only treat it as a full-number paste/autofill (and strip the
    // redundant country code / leading 0) once it's long enough to be a
    // complete number — otherwise a normal SA number typed digit-by-digit
    // (which legitimately starts with "0") would lose its leading 0 as soon
    // as it's typed.
    let nextLocal = rawLocal.trim();
    const codeDigits = nextCode.replace("+", "");
    const digitCount = nextLocal.replace(/\D/g, "").length;
    if (digitCount > 8) {
      if (nextLocal.startsWith(nextCode)) {
        nextLocal = nextLocal.slice(nextCode.length);
      } else if (nextLocal.startsWith(codeDigits)) {
        nextLocal = nextLocal.slice(codeDigits.length);
      } else if (nextCode === "+27" && nextLocal.startsWith("0")) {
        nextLocal = nextLocal.slice(1);
      }
    }

    setCellCountryCode(nextCode);
    setCellLocalNumber(nextLocal);
    const digitsOnly = nextLocal.replace(/[^\d]/g, "");
    const combined = digitsOnly ? `${nextCode}${digitsOnly}` : "";
    setFields((prev) => ({ ...prev, cellPhone: combined }));
    if (errors.cellPhone) setErrors((prev) => { const next = { ...prev }; delete next.cellPhone; return next; });
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
        <h2 className="text-xl font-semibold text-(--text-primary)">Section A — Applicant Information</h2>
        <p className="mt-1 text-sm text-(--text-secondary)">Tell us about yourself. All fields marked * are required.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-(--text-primary) mb-1" htmlFor="firstName">
            First Name <span className="text-error">*</span>
          </label>
          <input
            id="firstName" name="firstName" type="text" autoComplete="given-name"
            value={fields.firstName} onChange={handleChange}
            className={`h-10 w-full rounded-lg border px-3 bg-(--bg-primary) text-(--text-primary) border-(--border-color) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.firstName ? "ring-2 ring-error border-error" : ""}`}
          />
          {errors.firstName && <p className="mt-1 text-xs text-error">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-(--text-primary) mb-1" htmlFor="surname">
            Surname <span className="text-error">*</span>
          </label>
          <input
            id="surname" name="surname" type="text" autoComplete="family-name"
            value={fields.surname} onChange={handleChange}
            className={`h-10 w-full rounded-lg border px-3 bg-(--bg-primary) text-(--text-primary) border-(--border-color) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.surname ? "ring-2 ring-error border-error" : ""}`}
          />
          {errors.surname && <p className="mt-1 text-xs text-error">{errors.surname}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-(--text-primary) mb-1" htmlFor="physicalAddress">
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
          className={`w-full rounded-lg border px-3 py-2 bg-(--bg-primary) text-(--text-primary) border-(--border-color) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${errors.physicalAddress ? "ring-2 ring-error border-error" : ""}`}
        />
        {errors.physicalAddress && <p className="mt-1 text-xs text-error">{errors.physicalAddress}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-(--text-primary)" htmlFor="postalAddress">
            Postal Address
          </label>
          <label className="flex items-center gap-1.5 text-xs text-(--text-secondary) cursor-pointer">
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
          className="w-full rounded-lg border px-3 py-2 bg-(--bg-primary) text-(--text-primary) border-(--border-color) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-(--text-primary) mb-1" htmlFor="cellPhone">
          Cell Phone <span className="text-error">*</span>
        </label>
        <div className="flex gap-2">
          <CountryCodeSelect
            value={cellCountryCode}
            onChange={(code) => handleCellPhoneChange(code, cellLocalNumber)}
          />
          <input
            id="cellPhone" name="cellPhone" type="tel" autoComplete="off"
            placeholder="82 123 4567"
            value={cellLocalNumber}
            onChange={(e) => handleCellPhoneChange(cellCountryCode, e.target.value)}
            className={`h-10 w-full rounded-lg border px-3 bg-(--bg-primary) text-(--text-primary) border-(--border-color) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.cellPhone ? "ring-2 ring-error border-error" : ""}`}
          />
        </div>
        {errors.cellPhone && <p className="mt-1 text-xs text-error">{errors.cellPhone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-(--text-primary) mb-1" htmlFor="telephone">
          Telephone (Landline)
        </label>
        <input
          id="telephone" name="telephone" type="tel"
          placeholder="021 000 0000"
          value={fields.telephone} onChange={handleChange}
          className={`h-10 w-full rounded-lg border px-3 bg-(--bg-primary) text-(--text-primary) border-(--border-color) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.telephone ? "ring-2 ring-error border-error" : ""}`}
        />
        {errors.telephone && <p className="mt-1 text-xs text-error">{errors.telephone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-(--text-primary) mb-1" htmlFor="email">
          Email Address <span className="text-error">*</span>
        </label>
        <input
          id="email" name="email" type="email" autoComplete="email"
          placeholder="you@example.com"
          value={fields.email} onChange={handleChange}
          className={`h-10 w-full rounded-lg border px-3 bg-(--bg-primary) text-(--text-primary) border-(--border-color) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.email ? "ring-2 ring-error border-error" : ""}`}
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
