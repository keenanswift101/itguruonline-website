import Link from "next/link";

const footerLinks = {
  services: [
    { href: "/services#remote-support", label: "Remote Support" },
    { href: "/services#network", label: "Network Solutions" },
    { href: "/services#hardware", label: "Hardware Procurement" },
    { href: "/services#hosting", label: "Web Hosting" },
    { href: "/domain-checker", label: "Domain Registration" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/services", label: "Our Services" },
    { href: "/domain-checker", label: "Domain Checker" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]" aria-label="Site footer">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="font-bold text-xl text-primary-700">
              IT-Guru<span className="text-[var(--text-secondary)] font-normal text-sm">.Online</span>
            </Link>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Professional IT support, domain registration, and web hosting services based in
              Kuils River, South Africa.
            </p>
            <div className="mt-4 text-sm text-[var(--text-secondary)]">
              <p>Office Hours: 08:30 – 17:00 Mon – Fri</p>
              <p className="mt-1">
                <a href="tel:+27729627608" className="hover:text-primary-700 transition-colors">
                  +27 72 962 7608
                </a>
              </p>
              <p>
                <a href="mailto:support@it-guru.online" className="hover:text-primary-700 transition-colors">
                  support@it-guru.online
                </a>
              </p>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Services</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-primary-700 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Company</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-primary-700 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Legal</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-primary-700 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-[var(--border-color)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            &copy; {new Date().getFullYear()} IT-Guru Online. All rights reserved.
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Designed by{" "}
            <a
              href="https://swiftdesignz.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-700 hover:underline"
            >
              Swift Designz
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
