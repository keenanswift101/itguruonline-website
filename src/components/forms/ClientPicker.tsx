"use client";

import { useEffect, useRef, useState } from "react";
import type { ClientPickerOption } from "@/lib/client-types";

interface ClientPickerProps {
  clients: ClientPickerOption[];
  selectedClientId: number | null;
  onSelect: (client: ClientPickerOption | null) => void; // null = one-off / no stored client
}

export function ClientPicker({ clients, selectedClientId, onSelect }: ClientPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = clients.find((c) => c.id === selectedClientId) ?? null;
  const filtered = clients.filter((c) =>
    `${c.name} ${c.email} ${c.company}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-(--border-color) px-3 text-sm bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-[#00aaff] transition-colors"
      >
        <span>{selected ? `${selected.name} — ${selected.email}` : "One-off / no stored client"}</span>
        <svg className="h-3.5 w-3.5 text-(--text-secondary)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div role="listbox" className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-(--border-color) bg-(--bg-primary) py-1 shadow-xl">
          <div className="px-2 pb-1">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients…"
              className="h-9 w-full rounded-lg border border-(--border-color) px-2 text-sm bg-(--bg-primary) text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-[#00aaff]"
            />
          </div>
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false); setQuery(""); }}
            className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-(--bg-surface) ${selectedClientId == null ? "bg-(--bg-surface)" : ""}`}
          >
            One-off / no stored client
          </button>
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={c.id === selectedClientId}
              onClick={() => { onSelect(c); setOpen(false); setQuery(""); }}
              className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-(--bg-surface) ${c.id === selectedClientId ? "bg-(--bg-surface)" : ""}`}
            >
              <span className="text-(--text-primary)">{c.name}</span>
              <span className="text-xs text-(--text-secondary)">{c.email}{c.company ? ` · ${c.company}` : ""}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-(--text-secondary)">No matching clients.</p>
          )}
        </div>
      )}
    </div>
  );
}
