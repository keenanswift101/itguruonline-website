"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  email: string;
}

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/crm", label: "CRM" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar({ email }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      aria-label="Admin navigation"
      className="w-56 shrink-0 min-h-screen flex flex-col bg-(--bg-primary)/80 backdrop-blur-sm border-r border-(--border-color)"
    >
      <div className="p-4 border-b border-(--border-color)">
        <span className="text-(--text-primary) font-semibold text-sm">IT-Guru Admin</span>
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
      <div className="p-4 border-t border-(--border-color) text-(--text-secondary) text-xs truncate">
        {email}
      </div>
    </nav>
  );
}
