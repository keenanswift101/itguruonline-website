"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ClientListItem, ClientSource } from "@/lib/client-types";
import type React from "react";

interface ClientsTableProps {
  records: ClientListItem[];
}

const SOURCE_LABELS: Record<ClientSource, string> = {
  manual: "Manual",
  from_registration: "From registration",
  from_enquiry: "From enquiry",
};

const SOURCE_STYLE: Record<ClientSource, React.CSSProperties> = {
  manual: { color: "#00aaff", boxShadow: "0 0 8px #00aaff66" },
  from_registration: { color: "#a855f7", boxShadow: "0 0 8px #a855f766" },
  from_enquiry: { color: "#22c55e", boxShadow: "0 0 8px #22c55e66" },
};

export function ClientsTable({ records }: ClientsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return records.filter((r) =>
      `${r.name} ${r.email} ${r.company}`.toLowerCase().includes(query)
    );
  }, [records, search]);

  if (records.length === 0) {
    return (
      <div className="bg-(--bg-primary)/80 backdrop-blur-sm rounded-xl border border-(--border-color) p-8 text-center">
        <p className="text-(--text-secondary) text-sm">No clients yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search name, email, or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-(--bg-primary)/80 border border-(--border-color) text-(--text-primary) placeholder:text-(--text-secondary) text-sm focus:outline-none focus:border-[#00aaff] backdrop-blur-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-(--bg-primary)/80 backdrop-blur-sm rounded-xl border border-(--border-color) overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-(--text-secondary) text-sm">No matches.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--border-color)">
                  <th className="text-left px-4 py-3 text-(--text-secondary) font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-(--text-secondary) font-medium">Company</th>
                  <th className="text-left px-4 py-3 text-(--text-secondary) font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-(--text-secondary) font-medium">Phone</th>
                  <th className="text-left px-4 py-3 text-(--text-secondary) font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-(--text-secondary) font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-(--border-color) last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="text-(--text-primary) hover:underline font-medium"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-(--text-secondary)">{c.company || "—"}</td>
                    <td className="px-4 py-3 text-(--text-secondary)">{c.email}</td>
                    <td className="px-4 py-3 text-(--text-secondary)">{c.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full border"
                        style={{
                          ...SOURCE_STYLE[c.source],
                          borderColor: SOURCE_STYLE[c.source].color,
                          backgroundColor: `${SOURCE_STYLE[c.source].color as string}18`,
                        }}
                      >
                        {SOURCE_LABELS[c.source]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-(--text-secondary) text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
