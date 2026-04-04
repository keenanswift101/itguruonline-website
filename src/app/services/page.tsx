import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "From remote support and network solutions to web hosting, domain registration, and hardware procurement — IT-Guru Online covers all your IT needs in South Africa.",
};

const services = [
  {
    id: "remote-support",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
      </svg>
    ),
    title: "Remote / Online Support",
    tagline: "Expert help from anywhere in the world",
    description:
      "With remote support, an IT technician can securely connect to your device from anywhere in the world. They can view and diagnose a problem, and take control of your device to apply software fixes, patches, and configuration changes — all without a physical visit.",
    features: [
      "Secure, encrypted remote sessions",
      "Software troubleshooting & fixes",
      "Virus and malware removal",
      "Driver and OS updates",
      "Remote configuration assistance",
    ],
  },
  {
    id: "network-services",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: "Network Services & Solutions",
    tagline: "Reliable connectivity for your business",
    description:
      "We design, supply, and install complete network solutions for small and medium businesses. Whether you need a simple office Wi-Fi setup or a fully managed wired network with enterprise-grade routing, we have you covered.",
    features: [
      "Routers & managed switches",
      "Ethernet cabling & structured wiring",
      "Wi-Fi design and hardware installation",
      "Network security configuration",
      "VPN setup and management",
    ],
  },
  {
    id: "hardware-procurement",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
      </svg>
    ),
    title: "Hardware Procurement",
    tagline: "Quality hardware at competitive prices",
    description:
      "We supply all major brands of computer hardware, from desktops and laptops to peripherals and accessories. Need something custom? We build bespoke desktops and servers tailored to your exact workload requirements.",
    features: [
      "All major hardware brands in stock",
      "Custom-built desktops & servers on request",
      "Laptops, notebooks & accessories",
      "Printers and peripheral devices",
      "UPS and power management solutions",
    ],
  },
  {
    id: "troubleshooting",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    title: "Troubleshooting & Repairs",
    tagline: "Fast diagnostics, lasting fixes",
    description:
      "Hardware failures and software issues can cripple productivity. Our technicians provide rapid diagnosis and repair services for desktops and laptops — getting your team back up and running as quickly as possible.",
    features: [
      "Hardware fault diagnosis",
      "Desktop & laptop component repairs",
      "RAM, SSD, and HDD upgrades",
      "Screen replacement",
      "Data recovery assistance",
    ],
  },
  {
    id: "web-hosting",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 6 0m-6 0H3m16.5 0a3 3 0 0 0 3-3m-3 3a3 3 0 1 1-6 0m6 0h1.5m-13.5 0h6M3 11.25V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v5.25" />
      </svg>
    ),
    title: "Web Hosting & Domain Registration",
    tagline: "Reliable hosting with local support",
    description:
      "Register your .co.za or international domain and host your website on our reliable servers. We offer Windows and Linux hosting plans to suit any size of business, with local South African support you can actually reach.",
    features: [
      ".co.za, .com, .net, .org, and more",
      "Windows and Linux hosting environments",
      "SSL certificate provisioning",
      "Professional email hosting",
      "24/7 server monitoring",
    ],
    cta: { label: "Check Domain Availability", href: "/domain-checker" },
  },
  {
    id: "web-design",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
    title: "Web Design",
    tagline: "Professional sites by Swift Designz",
    description:
      "Through our partnership with Swift Designz, we offer professional website design and development services. From simple brochure sites to full e-commerce platforms — all built responsively and optimised for search engines.",
    features: [
      "Responsive, mobile-first design",
      "Custom branding and layout",
      "E-commerce solutions",
      "SEO optimisation built-in",
      "Ongoing maintenance packages",
    ],
    cta: { label: "Get a Quote", href: "https://swiftdesignz.co.za/quote" },
  },
];

const packages = [
  {
    name: "Starter",
    price: "R149",
    period: "/month",
    description: "Perfect for personal sites and small businesses just getting started online.",
    features: ["1 Website", "5 GB Storage", "10 Email Accounts", "Free SSL Certificate", "Basic Support"],
    highlight: false,
  },
  {
    name: "Business",
    price: "R299",
    period: "/month",
    description: "The most popular option for growing businesses with professional needs.",
    features: ["5 Websites", "25 GB Storage", "50 Email Accounts", "Free SSL Certificate", "Priority Support", "Daily Backups"],
    highlight: true,
  },
  {
    name: "Professional",
    price: "R549",
    period: "/month",
    description: "Full power for agencies, developers, or businesses managing multiple clients.",
    features: ["Unlimited Websites", "100 GB Storage", "Unlimited Email Accounts", "Free SSL Certificate", "24/7 Premium Support", "Daily Backups", "Staging Environment"],
    highlight: false,
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-(--bg-secondary) py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Our IT Services
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-(--text-secondary)">
            Comprehensive IT support, hosting, and infrastructure solutions for businesses
            in South Africa. Retain your core focus — let us handle the tech.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                id={service.id}
                className="rounded-2xl border border-(--border-color) bg-(--bg-primary) p-8 flex flex-col"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary-700/10 text-primary-700 mb-5">
                  {service.icon}
                </div>
                <h2 className="text-xl font-semibold">{service.title}</h2>
                <p className="mt-1 text-sm font-medium text-primary-700">{service.tagline}</p>
                <p className="mt-3 text-sm text-(--text-secondary) leading-relaxed">{service.description}</p>
                <ul className="mt-5 space-y-2 flex-1">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-(--text-secondary)">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {service.cta && (
                  <div className="mt-6">
                    {service.cta.href.startsWith("http") ? (
                      <a
                        href={service.cta.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md border border-primary-700 text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {service.cta.label}
                      </a>
                    ) : (
                      <Button variant="secondary" size="sm" href={service.cta.href}>
                        {service.cta.label}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hosting Packages */}
      <section className="bg-(--bg-secondary) py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Web Hosting Plans
            </h2>
            <p className="mt-4 text-lg text-(--text-secondary)">
              Simple, transparent pricing. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  pkg.highlight
                    ? "bg-primary-700 text-white shadow-xl ring-2 ring-primary-700"
                    : "border border-(--border-color) bg-(--bg-primary)"
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-teal-400 px-3 py-0.5 text-xs font-semibold text-teal-900">
                    Most Popular
                  </span>
                )}
                <h3 className={`text-xl font-bold ${pkg.highlight ? "text-white" : ""}`}>
                  {pkg.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${pkg.highlight ? "text-white" : ""}`}>
                    {pkg.price}
                  </span>
                  <span className={`text-sm ${pkg.highlight ? "text-teal-100" : "text-(--text-secondary)"}`}>
                    {pkg.period}
                  </span>
                </div>
                <p className={`mt-3 text-sm ${pkg.highlight ? "text-teal-100" : "text-(--text-secondary)"}`}>
                  {pkg.description}
                </p>
                <ul className="mt-6 space-y-3 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg
                        className={`mt-0.5 h-4 w-4 shrink-0 ${pkg.highlight ? "text-teal-300" : "text-primary-700"}`}
                        fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"
                      >
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                      <span className={pkg.highlight ? "text-white" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {pkg.highlight ? (
                    <Link
                      href={`/register?package=${pkg.name.toLowerCase()}`}
                      className="inline-flex w-full items-center justify-center h-10 px-4 text-base font-medium rounded-lg bg-white text-primary-700 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700"
                    >
                      Get Started
                    </Link>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full justify-center"
                      href={`/register?package=${pkg.name.toLowerCase()}`}
                    >
                      Get Started
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Not sure which service you need?
          </h2>
          <p className="mt-4 text-lg text-(--text-secondary)">
            Contact us and we&apos;ll help you find the right solution for your business.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" href="/contact">Get in Touch</Button>
            <Button variant="secondary" size="lg" href="/register">Start Registration</Button>
          </div>
        </div>
      </section>
    </>
  );
}
