import type { Metadata } from "next";
import { DomainChecker } from "@/components/forms/DomainChecker";

export const metadata: Metadata = {
  title: "Domain Availability Checker",
  description:
    "Check if your perfect domain name is available. Search .co.za, .com, .net, .org, .online, and .africa domains instantly. Register directly with IT-Guru Online.",
};

export default function DomainCheckerPage() {
  return (
    <div className="bg-[var(--bg-secondary)] min-h-screen">
      {/* Hero section */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Find Your Perfect{" "}
          <span className="text-primary-700">Domain Name</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">
          Search across .co.za, .com, .net, .org, .online, and .africa — all at once.
          When you find the right one, register it directly with IT-Guru Online.
        </p>

        <div className="mt-10">
          <DomainChecker />
        </div>
      </section>

      {/* Why register with us */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight mb-8">
            Why Register With IT-Guru Online?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: "⚡",
                title: "Fast Activation",
                desc: "Domains activated within hours of registration and payment.",
              },
              {
                icon: "🛡️",
                title: "Managed DNS",
                desc: "We handle your nameserver settings so you don't have to.",
              },
              {
                icon: "🤝",
                title: "Local Support",
                desc: "Real South African support — call or WhatsApp +27 72 962 7608.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 text-center"
              >
                <div className="text-3xl">{item.icon}</div>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TLD info table */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight mb-8">
            Domain Extensions We Support
          </h2>
          <div className="overflow-hidden rounded-xl border border-[var(--border-color)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-surface)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
                    Extension
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
                    Best For
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
                    Recommended
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {[
                  {
                    tld: ".co.za",
                    desc: "South African businesses",
                    rec: "✅ Local credibility",
                  },
                  {
                    tld: ".com",
                    desc: "Global / international reach",
                    rec: "✅ Universal recognition",
                  },
                  {
                    tld: ".net",
                    desc: "Tech & network companies",
                    rec: "Good alternative",
                  },
                  {
                    tld: ".org",
                    desc: "Non-profits & organisations",
                    rec: "Good alternative",
                  },
                  {
                    tld: ".online",
                    desc: "Online businesses & services",
                    rec: "Modern & affordable",
                  },
                  {
                    tld: ".africa",
                    desc: "Pan-African businesses",
                    rec: "Growing recognition",
                  },
                ].map((row) => (
                  <tr
                    key={row.tld}
                    className="bg-[var(--bg-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-primary-700">
                      {row.tld}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.desc}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
