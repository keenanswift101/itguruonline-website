"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/domain-checker", label: "Domain Checker" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/15 bg-white/8 backdrop-blur-xl">
      <div className="relative mx-auto flex h-24 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/FullLogo_Transparent.png"
            alt="IT-Guru Online"
            width={360}
            height={120}
            priority
            className="h-28 w-auto saturate-200 contrast-125"
          />
        </Link>

        {/* Desktop nav — absolutely centered */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0.5 left-2 right-2 h-0.5 rounded-full"
                    style={{
                      background: "#00aaff",
                      boxShadow: "0 0 8px 3px rgba(0,170,255,0.70)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Register CTA + mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="btn-metallic hidden md:inline-flex h-7 items-center justify-center px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            Register
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/70 hover:bg-white/15 hover:text-white transition-colors md:hidden cursor-pointer"
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
        <nav id="mobile-nav" className="border-t border-white/15 bg-black/40 backdrop-blur-xl px-4 py-2 md:hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`block px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-white/70 hover:text-white"
                }`}
              >
                <span className="relative inline-block">
                  {link.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                      style={{
                        background: "#00aaff",
                        boxShadow: "0 0 8px 3px rgba(0,170,255,0.70)",
                      }}
                    />
                  )}
                </span>
              </Link>
            );
          })}
          {/* Register CTA in mobile nav */}
          <div className="px-3 py-3">
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="btn-metallic inline-flex w-full h-10 items-center justify-center px-5 text-sm focus:outline-none"
            >
              Register
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
