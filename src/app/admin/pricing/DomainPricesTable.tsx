"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

interface DomainPricesTableProps {
  domainPrices: Record<string, number | null>;
}

export function DomainPricesTable({ domainPrices }: DomainPricesTableProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(domainPrices).map(([tld, price]) => [
        tld,
        price != null ? String(price) : "",
      ])
    )
  );
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});

  function setSaveState(tld: string, state: SaveState) {
    setSaveStates((prev) => ({ ...prev, [tld]: state }));
  }

  async function handleBlur(tld: string) {
    const raw = values[tld] ?? "";
    const trimmed = raw.trim();
    const original = domainPrices[tld];

    // Determine the new value: blank = null, otherwise parse as number
    const newPrice: number | null = trimmed === "" ? null : Number(trimmed);

    // Skip save if unchanged
    if (newPrice === original) return;

    setSaveState(tld, "saving");
    const url = `/api/admin/pricing/domains/${encodeURIComponent(tld)}`;
    const ok = await patch(url, { priceRands: newPrice });
    setSaveState(tld, ok ? "saved" : "error");
    if (ok) {
      setTimeout(() => setSaveState(tld, "idle"), 1500);
      router.refresh();
    }
  }

  const entries = Object.entries(domainPrices);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-(--text-secondary)">No domain prices found. Check the database seed.</p>
    );
  }

  return (
    <div className="rounded-xl border border-(--border-color) bg-(--bg-primary)/80 backdrop-blur-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-(--border-color)">
            <th className="px-4 py-3 text-left text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
              TLD
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-(--text-secondary) uppercase tracking-wide">
              Price (R/yr) — leave blank to hide
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-(--text-secondary) uppercase tracking-wide w-24">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([tld]) => (
            <tr key={tld} className="border-b border-(--border-color) last:border-0">
              <td className="px-4 py-3 font-mono text-(--text-primary)">{tld}</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  value={values[tld] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [tld]: e.target.value }))
                  }
                  onBlur={() => handleBlur(tld)}
                  placeholder="—"
                  min={0}
                  className="w-28 rounded-lg border border-(--border-color) bg-white/10 px-3 py-1 text-sm text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </td>
              <td className="px-4 py-3">
                <SaveIndicator state={saveStates[tld] ?? "idle"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
