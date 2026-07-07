"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationBell } from "./NotificationBell";

interface AdminSidebarProps {
  email: string;
}

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/crm", label: "CRM" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/quotations", label: "Quotations" },
  { href: "/admin/automations", label: "Automations" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar({ email }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  function isActive(href: string): boolean {
    if (href === "/admin/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <nav
      aria-label="Admin navigation"
      className="w-56 shrink-0 min-h-screen flex flex-col bg-(--bg-primary)/80 backdrop-blur-sm border-r border-(--border-color)"
    >
      <div className="p-4 border-b border-(--border-color) flex items-center justify-between">
        <span className="text-(--text-primary) font-semibold text-sm">IT-Guru Admin</span>
        <NotificationBell />
      </div>
      <ul className="flex-1 py-2">
        {navLinks.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={
                "block px-4 py-2 text-sm rounded-lg mx-2 my-0.5 transition-colors " +
                (isActive(href)
                  ? "text-(--text-primary) bg-white/10"
                  : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5")
              }
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-(--border-color)">
        <p className="text-(--text-secondary) text-xs truncate mb-2">{email}</p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-left px-2 py-1.5 text-sm rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </nav>
  );
}
