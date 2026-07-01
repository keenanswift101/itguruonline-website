"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { CrmListItem, CrmStatus } from "@/lib/crm-types";
import { CRM_STATUSES, STATUS_LABELS, encodeCrmId } from "@/lib/crm-types";
import type React from "react";

interface CrmTableProps {
  records: CrmListItem[];
}

const STATUS_STYLE: Record<CrmStatus, React.CSSProperties> = {
  new: { color: "#00aaff", boxShadow: "0 0 8px #00aaff66" },
  contacted: { color: "#f59e0b", boxShadow: "0 0 8px #f59e0b66" },
  in_progress: { color: "#a855f7", boxShadow: "0 0 8px #a855f766" },
  completed: { color: "#22c55e", boxShadow: "0 0 8px #22c55e66" },
};

export function CrmTable({ records }: CrmTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return records.filter((r) => {
      const matchesSearch = `${r.name} ${r.email}`.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  if (records.length === 0) {
    return (
      <div className="bg-(--bg-primary)/80 backdrop-blur-sm rounded-xl border border-(--border-color) p-8 text-center">
        <p className="text-(--text-secondary) text-sm">No records yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-(--bg-primary)/80 border border-(--border-color) text-(--text-primary) placeholder:text-(--text-secondary) text-sm focus:outline-none focus:border-[#00aaff] backdrop-blur-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-(--bg-primary)/80 border border-(--border-color) text-(--text-primary) text-sm focus:outline-none focus:border-[#00aaff] backdrop-blur-sm"
        >
          <option value="all">All statuses</option>
          {CRM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
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
                  <th className="text-left px-4 py-3 text-(--text-secondary) font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-(--text-secondary) font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-(--text-secondary) font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-(--text-secondary) font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={encodeCrmId(r.recordType, r.id)}
                    className="border-b border-(--border-color) last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/crm/${encodeCrmId(r.recordType, r.id)}`}
                        className="text-(--text-primary) hover:underline font-medium"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-(--text-secondary)">{r.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-(--text-secondary) capitalize">
                        {r.recordType === "registration" ? "Registration" : "Enquiry"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full border"
                        style={{
                          ...STATUS_STYLE[r.status],
                          borderColor: STATUS_STYLE[r.status].color,
                          backgroundColor: `${STATUS_STYLE[r.status].color as string}18`,
                        }}
                      >
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-(--text-secondary) text-xs">
                      {new Date(r.createdAt).toLocaleDateString()}
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
