"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HostingPackageDTO } from "@/lib/pricing";

type SaveState = "idle" | "saving" | "saved" | "error";

async function patch(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return <span className="text-xs text-(--text-secondary)">Saving…</span>;
  }
  if (state === "saved") {
    return <span className="text-xs text-green-400 transition-opacity">Saved ✓</span>;
  }
  if (state === "error") {
    return <span className="text-xs text-red-400">Save failed</span>;
  }
  return null;
}

interface PackageRowProps {
  pkg: HostingPackageDTO;
}

function PackageRow({ pkg }: PackageRowProps) {
  const router = useRouter();
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  // Local editable state — initialised from props
  const [name, setName] = useState(pkg.name);
  const [priceRands, setPriceRands] = useState(String(pkg.priceRands));
  const [pricePeriod, setPricePeriod] = useState(pkg.pricePeriod);
  const [description, setDescription] = useState(pkg.description);
  const [features, setFeatures] = useState(pkg.features.join("\n"));
  const [isPopular, setIsPopular] = useState(pkg.isPopular);

  const url = `/api/admin/pricing/packages/${pkg.id}`;

  function setSaveState(field: string, state: SaveState) {
    setSaveStates((prev) => ({ ...prev, [field]: state }));
  }

  async function save(field: string, body: unknown, newValue: unknown, originalValue: unknown) {
    if (newValue === originalValue) return;
    setSaveState(field, "saving");
    const ok = await patch(url, body);
    setSaveState(field, ok ? "saved" : "error");
    if (ok) {
      setTimeout(() => setSaveState(field, "idle"), 1500);
      router.refresh();
    }
  }

  async function saveIsPopular(checked: boolean) {
    setSaveState("isPopular", "saving");
    const ok = await patch(url, { isPopular: checked });
    setSaveState("isPopular", ok ? "saved" : "error");
    if (ok) {
      setTimeout(() => setSaveState("isPopular", "idle"), 1500);
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm p-5 space-y-4">
      {/* Package name + isPopular */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-48 space-y-1">
          <label className="text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
            Name
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => save("name", { name }, name, pkg.name)}
              className="w-full rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30"
            />
            <SaveIndicator state={saveStates.name ?? "idle"} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-(--text-secondary) flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPopular}
              onChange={(e) => {
                setIsPopular(e.target.checked);
                saveIsPopular(e.target.checked);
              }}
              className="rounded"
            />
            Most Popular
          </label>
          <SaveIndicator state={saveStates.isPopular ?? "idle"} />
        </div>
      </div>

      {/* Price + Period */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
            Price (R)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={priceRands}
              onChange={(e) => setPriceRands(e.target.value)}
              onBlur={() =>
                save(
                  "priceRands",
                  { priceRands: Number(priceRands) },
                  Number(priceRands),
                  pkg.priceRands
                )
              }
              className="w-28 rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30"
              min={1}
            />
            <SaveIndicator state={saveStates.priceRands ?? "idle"} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
            Period
          </label>
          <div className="flex items-center gap-2">
            <select
              value={pricePeriod}
              onChange={(e) => setPricePeriod(e.target.value)}
              onBlur={() =>
                save("pricePeriod", { pricePeriod }, pricePeriod, pkg.pricePeriod)
              }
              className="rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="mo">per month</option>
              <option value="yr">per year</option>
            </select>
            <SaveIndicator state={saveStates.pricePeriod ?? "idle"} />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
          Description
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() =>
              save("description", { description }, description, pkg.description)
            }
            className="w-full rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          <SaveIndicator state={saveStates.description ?? "idle"} />
        </div>
      </div>

      {/* Features */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
          Features (one per line)
        </label>
        <div className="flex gap-2">
          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            onBlur={() =>
              save("features", { features }, features, pkg.features.join("\n"))
            }
            rows={4}
            className="w-full rounded-lg border border-(--border-color) bg-white/10 px-3 py-1.5 text-sm text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-white/30 resize-y"
          />
          <SaveIndicator state={saveStates.features ?? "idle"} />
        </div>
      </div>
    </div>
  );
}

interface PricingPackagesTableProps {
  packages: HostingPackageDTO[];
}

export function PricingPackagesTable({ packages }: PricingPackagesTableProps) {
  if (packages.length === 0) {
    return (
      <p className="text-sm text-(--text-secondary)">No packages found. Check the database seed.</p>
    );
  }

  return (
    <div className="space-y-4">
      {packages.map((pkg) => (
        <PackageRow key={pkg.id} pkg={pkg} />
      ))}
    </div>
  );
}
