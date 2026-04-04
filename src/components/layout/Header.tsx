"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/domain-checker", label: "Domain Checker" },
  { href: "/contact", label: "Contact" },
  { href: "/register", label: "Register" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-(--border-color) bg-(--bg-primary)/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-700">
          <span>IT-Guru</span>
          <span className="text-(--text-secondary) font-normal text-sm">.Online</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                link.href === "/register"
                  ? pathname === "/register"
                    ? "text-white bg-primary-700"
                    : "text-primary-600 dark:text-primary-400 hover:text-white hover:bg-primary-700"
                  : pathname === link.href
                  ? "text-primary-700 bg-primary-700/10"
                  : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-surface)"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Remote Support icon button */}
          <Link
            href="/contact"
            title="Remote Support"
            aria-label="Remote Support"
            className="group hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-lg border border-(--border-color) bg-(--bg-surface)/60 text-(--text-secondary) transition-colors hover:border-primary-600/50 hover:bg-primary-600/10 hover:text-primary-500"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5.5 7.5 L8.5 9.75 L5.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.5 12 h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>

          {/* Services icon button */}
          <Link
            href="/services"
            title="Our Services"
            aria-label="Our Services"
            className="group hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-lg border border-(--border-color) bg-(--bg-surface)/60 text-(--text-secondary) transition-colors hover:border-primary-600/50 hover:bg-primary-600/10 hover:text-primary-500"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7" cy="5" r="2" fill="currentColor" />
              <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="13" cy="10" r="2" fill="currentColor" />
              <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="9" cy="15" r="2" fill="currentColor" />
            </svg>
          </Link>

          <div className="hidden sm:block w-px h-5 bg-(--border-color) mx-1" aria-hidden="true" />

          <ThemeToggle />

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-(--bg-surface) transition-colors md:hidden cursor-pointer"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav id="mobile-nav" className="border-t border-(--border-color) px-4 py-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-primary-700 bg-primary-700/10"
                  : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-surface)"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
