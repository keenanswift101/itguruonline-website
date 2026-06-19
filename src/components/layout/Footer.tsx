import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  services: [
    { href: "/services#remote-support",      label: "Remote Support" },
    { href: "/services#network-services",    label: "Network Solutions" },
    { href: "/services#hardware-procurement",label: "Hardware Procurement" },
    { href: "/services#web-hosting",         label: "Web Hosting" },
    { href: "/domain-checker",               label: "Domain Registration" },
  ],
  company: [
    { href: "/about",          label: "About Us" },
    { href: "/services",       label: "Our Services" },
    { href: "/domain-checker", label: "Domain Checker" },
    { href: "/contact",        label: "Contact" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms",   label: "Terms of Service" },
  ],
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden" aria-label="Site footer">
      {/* Background image */}
      <Image
        src="/footer_bg.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden="true"
      />

      {/* Dark overlay so text is always legible */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,24,32,0.60) 0%, rgba(8,18,28,0.72) 100%)",
        }}
      />

      {/* Top border accent */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(20,184,166,0.6) 40%, rgba(59,130,246,0.5) 60%, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block">
              {/* Always use the white logo — footer bg is always dark */}
              <Image
                src="/FullLogo_Transparent.png"
                alt="IT-Guru Online"
                width={300}
                height={100}
                className="h-24 w-auto saturate-200 contrast-125"
              />
            </Link>
            <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#38bdf8]">
              Your IT Needs, Our Priority
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Professional IT support, domain registration, and web hosting services based in
              Kuils River, South Africa.
            </p>
            <div className="mt-4 text-sm text-slate-300">
              <p>Office Hours: 08:30 – 17:00 Mon – Fri</p>
              <p className="mt-1">
                <a href="tel:+27729627608" className="hover:text-primary-300 transition-colors">
                  +27 72 962 7608
                </a>
              </p>
              <p>
                <a href="mailto:info@it-guru.online" className="hover:text-primary-300 transition-colors">
                  info@it-guru.online
                </a>
              </p>
            </div>
          </div>

          {/* Services */}
          <div className="lg:pt-28">
            <h3 className="text-sm font-semibold text-white">Services</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-primary-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:pt-28">
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-primary-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:pt-28">
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-primary-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} IT-Guru Online. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">
            Built by{" "}
            <a
              href="https://swiftdesignz.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-300 hover:underline"
            >
              Swift Designz
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
