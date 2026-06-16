import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "IT-Guru Online Terms of Service — the terms and conditions governing the use of our website and services.",
};

export default function TermsPage() {
  const updated = "23 March 2026";

  return (
    <div className="relative overflow-hidden min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image src="/bg-image.jpg" alt="" fill className="object-cover object-center" aria-hidden="true" priority />
        <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-hidden="true" />
      </div>

      {/* Hero banner */}
      <section className="relative overflow-hidden py-10 sm:py-14" aria-label="Terms of service hero">
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
        <Reveal className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary-400">~/legal</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Terms of Service</h1>
          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-primary-500" />
        </Reveal>
      </section>
      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-(--border-color) bg-(--bg-primary) p-8 sm:p-12">
          <Reveal>
            <p className="text-sm text-(--text-secondary)">Last updated: {updated}</p>
          </Reveal>

          <Reveal delayMs={80} className="mt-8 prose prose-sm max-w-none text-(--text-secondary) space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-(--text-primary) mt-0">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the IT-Guru Online website and services, you agree to be bound by these
                Terms of Service. If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">2. Services</h2>
              <p>
                IT-Guru Online provides IT support, domain registration, web hosting, hardware procurement, and
                related services. Specific terms for individual services are communicated at the point of purchase
                or agreement. We reserve the right to modify or discontinue services with reasonable notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">3. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide accurate and complete registration information</li>
                <li>Keep your account credentials confidential</li>
                <li>Use our services only for lawful purposes</li>
                <li>Not engage in any activity that disrupts or interferes with our services</li>
                <li>Comply with all applicable South African laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">4. Payment & Billing</h2>
              <p>
                All prices are quoted in South African Rand (ZAR) and are inclusive of VAT unless stated otherwise.
                Invoices are due on receipt unless a payment term has been agreed in writing. We reserve the right
                to suspend services on accounts that are in arrears.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">5. Domain Names</h2>
              <p>
                Domain registration is subject to the rules and policies of the relevant registrar (e.g. ZACR for
                .co.za domains). IT-Guru Online acts as a reseller and cannot guarantee availability. Domains
                registered on your behalf remain your property subject to ongoing renewal fees.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">6. Limitation of Liability</h2>
              <p>
                IT-Guru Online shall not be liable for any indirect, incidental, or consequential damages arising
                from the use of our services. Our total liability in any matter shall not exceed the amount paid
                by you for the relevant service in the preceding three months.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">7. Intellectual Property</h2>
              <p>
                All content on this website, including text, graphics, logos, and software, is the property of
                IT-Guru Online or its content suppliers and is protected by applicable intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">8. Termination</h2>
              <p>
                Either party may terminate a service agreement with 30 days&apos; written notice. We reserve the
                right to terminate immediately in cases of material breach of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">9. Governing Law</h2>
              <p>
                These terms are governed by the laws of the Republic of South Africa. Any disputes shall be
                subject to the jurisdiction of the South African courts.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">10. Contact</h2>
              <p>
                For questions about these terms, please contact us:
              </p>
              <ul className="list-none pl-0 space-y-1 mt-2">
                <li>
                  <strong className="text-(--text-primary)">IT-Guru Online</strong>
                </li>
                <li>Kuils River, Western Cape, South Africa</li>
                <li>
                  Email:{" "}
                  <a href="mailto:info@it-guru.co.za" className="text-primary-700 hover:underline">
                    info@it-guru.co.za
                  </a>
                </li>
                <li>
                  Phone:{" "}
                  <a href="tel:+27729627608" className="text-primary-700 hover:underline">
                    +27 72 962 7608
                  </a>
                </li>
              </ul>
            </section>
          </Reveal>

          <Reveal delayMs={160} className="mt-10 pt-6 border-t border-(--border-color)">
            <Link href="/" className="text-sm text-primary-700 hover:underline">
              &larr; Back to Home
            </Link>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
