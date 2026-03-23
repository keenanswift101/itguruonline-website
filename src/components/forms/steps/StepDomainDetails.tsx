"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { StepBData } from "@/lib/registration-types";
import { validateStepB } from "@/lib/registration-validators";

interface StepBProps {
  data: StepBData;
  onNext: (data: StepBData) => void;
  onBack: () => void;
}

export function StepDomainDetails({ data, onNext, onBack }: StepBProps) {
  const [fields, setFields] = useState<StepBData>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
  }

  function handleNext() {
    const errs = validateStepB(fields);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext(fields);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Section B — Domain Details</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Confirm your domain name. Leave nameservers blank to use IT-Guru defaults.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="domainName">
          Domain Name <span className="text-error">*</span>
        </label>
        <input
          id="domainName" name="domainName" type="text" autoComplete="off"
          placeholder="mycompany.co.za"
          value={fields.domainName} onChange={handleChange}
          className={`h-10 w-full rounded-lg border px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono ${errors.domainName ? "ring-2 ring-error border-error" : ""}`}
        />
        {errors.domainName
          ? <p className="mt-1 text-xs text-error">{errors.domainName}</p>
          : <p className="mt-1 text-xs text-[var(--text-secondary)]">Include the extension, e.g. mycompany.co.za</p>
        }
      </div>

      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-4">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-3">DNS / Nameserver Settings</p>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Leave these blank and IT-Guru Online will configure your DNS automatically.
          Only fill these in if you have custom nameservers.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1" htmlFor="nameserver1">
              Nameserver 1
            </label>
            <input
              id="nameserver1" name="nameserver1" type="text" autoComplete="off"
              placeholder="ns1.it-guru.online"
              value={fields.nameserver1} onChange={handleChange}
              className="h-9 w-full rounded-lg border px-3 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1" htmlFor="nameserver2">
              Nameserver 2
            </label>
            <input
              id="nameserver2" name="nameserver2" type="text" autoComplete="off"
              placeholder="ns2.it-guru.online"
              value={fields.nameserver2} onChange={handleChange}
              className="h-9 w-full rounded-lg border px-3 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext} size="lg">Continue →</Button>
      </div>
    </div>
  );
}
