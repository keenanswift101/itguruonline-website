import type { Metadata } from "next";
import Image from "next/image";
import { DomainChecker } from "@/components/forms/DomainChecker";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Domain Availability Checker",
  description:
    "Check if your perfect domain name is available. Search .co.za, .com, .net, .org, .online, and .africa domains instantly. Register directly with IT-Guru Online.",
};

export default function DomainCheckerPage() {
  return (
    <div className="relative overflow-hidden min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image src="/bg-image.jpg" alt="" fill className="object-cover object-center" aria-hidden="true" priority />
      </div>

      {/* Hero section */}
      <section className="relative overflow-hidden py-16 sm:py-24" aria-label="Domain checker hero">
        <Reveal className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-400">
            ~/domains
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Find Your Perfect Domain
          </h1>
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-primary-500" />
          <p className="mt-6 text-lg text-slate-300">
            Search across .co.za, .com, .net, .org, .online, and .africa — all at once.
            When you find the right one, register it directly with IT-Guru Online.
          </p>
          <div className="mt-10">
            <DomainChecker />
          </div>
        </Reveal>
      </section>

      {/* Why register with us */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center text-2xl font-bold tracking-tight mb-8">
              Why Register With IT-Guru Online?
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                ),
                title: "Fast Activation",
                desc: "Domains activated within hours of registration and payment.",
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                ),
                title: "Managed DNS",
                desc: "We handle your nameserver settings so you don't have to.",
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                ),
                title: "Local Support",
                desc: "Real South African support — call or WhatsApp +27 72 962 7608.",
              },
            ].map((item, i) => (
              <Reveal
                key={item.title}
                delayMs={i * 80}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 text-center"
              >
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700/10 text-primary-700">
                  {item.icon}
                </div>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TLD info table */}
      <section className="relative overflow-hidden py-12 sm:py-16">
        <Reveal className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight mb-8">
            Domain Extensions We Support
          </h2>
          <div className="overflow-hidden rounded-xl border border-[var(--border-color)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-surface)]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
                    Extension
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
                    Best For
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
                    Recommended
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {[
                  {
                    tld: ".co.za",
                    desc: "South African businesses",
                    rec: "Local credibility",
                  },
                  {
                    tld: ".com",
                    desc: "Global / international reach",
                    rec: "Universal recognition",
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
        </Reveal>
      </section>
    </div>
  );
}
