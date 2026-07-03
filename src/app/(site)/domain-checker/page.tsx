import type { Metadata } from "next";
import Image from "next/image";
import { DomainChecker } from "@/components/forms/DomainChecker";
import { Reveal } from "@/components/ui/Reveal";
import { getDomainPriceMap } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Domain Availability Checker",
  description:
    "Check if your perfect domain name is available. Search .co.za, .com, .net, .org, .online, and .africa domains instantly. Register directly with IT-Guru Online.",
};

export default async function DomainCheckerPage() {
  const domainPrices = await getDomainPriceMap();
  return (
    <div className="relative overflow-hidden min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image src="/bg-image.jpg" alt="" fill className="object-cover object-center" aria-hidden="true" priority />
        <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-hidden="true" />
      </div>

      {/* Hero section */}
      <section className="relative overflow-hidden py-10 sm:py-14" aria-label="Domain checker hero">
        <div className="flex justify-center mb-8">
          <Image
            src="/FullLogo_Transparent.png"
            alt="IT-Guru Online"
            width={360}
            height={120}
            priority
            className="h-20 sm:h-24 w-auto saturate-200 contrast-125"
          />
        </div>
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
            <DomainChecker domainPrices={domainPrices} />
          </div>
        </Reveal>
      </section>

      {/* Why register with us */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center text-2xl font-bold tracking-tight text-white mb-8">
              Why Register With IT-Guru Online?
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                title: "Fast Activation",
                desc: "Domains activated within hours of registration and payment.",
              },
              {
                title: "Managed DNS",
                desc: "We handle your nameserver settings so you don't have to.",
              },
              {
                title: "Local Support",
                desc: "Real South African support — call or WhatsApp +27 72 962 7608.",
              },
            ].map((item, i) => (
              <Reveal
                key={item.title}
                delayMs={i * 80}
                className="bg-metallic-navy group rounded-2xl border border-[#00aaff]/50 p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00aaff] shadow-[0_0_14px_-4px_rgba(0,170,255,0.45)] hover:shadow-[0_0_30px_0px_rgba(0,170,255,0.75)]"
              >
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-blue-200">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TLD info table */}
      <section className="relative overflow-hidden py-12 sm:py-16">
        <Reveal className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-white mb-8">
            Domain Extensions We Support
          </h2>
          <div className="overflow-hidden rounded-xl border border-[#00aaff]/40 bg-white/8 backdrop-blur-xl shadow-[0_0_20px_-6px_rgba(0,170,255,0.35)]">
            <div className="overflow-x-auto">
            <table className="w-full min-w-120 text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-white">
                    Extension
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-white">
                    Best For
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-white">
                    Recommended
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  {
                    tld: ".co.za",
                    desc: "South African businesses",
                    rec: "Local credibility",
                    popular: true,
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
                    className={`hover:bg-white/5 transition-colors ${row.popular ? "bg-amber-400/8" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-primary-400">
                      <span className="inline-flex items-center gap-1.5">
                        {row.tld}
                        {row.popular && (
                          <span className="inline-flex items-center rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            ★ Most Popular
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{row.desc}</td>
                    <td className="px-4 py-3 text-slate-300">{row.rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
