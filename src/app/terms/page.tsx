import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "IT-Guru Online Terms of Service — the terms and conditions governing the use of our website and services.",
};

export default function TermsPage() {
  const updated = "23 March 2026";

  return (
    <div className="bg-[var(--bg-secondary)] min-h-screen py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-8 sm:p-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Last updated: {updated}</p>

          <div className="mt-8 prose prose-sm max-w-none text-[var(--text-secondary)] space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-0">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the IT-Guru Online website and services, you agree to be bound by these
                Terms of Service. If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">2. Services</h2>
              <p>
                IT-Guru Online provides IT support, domain registration, web hosting, hardware procurement, and
                related services. Specific terms for individual services are communicated at the point of purchase
                or agreement. We reserve the right to modify or discontinue services with reasonable notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">3. User Responsibilities</h2>
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
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">4. Payment & Billing</h2>
              <p>
                All prices are quoted in South African Rand (ZAR) and are inclusive of VAT unless stated otherwise.
                Invoices are due on receipt unless a payment term has been agreed in writing. We reserve the right
                to suspend services on accounts that are in arrears.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">5. Domain Names</h2>
              <p>
                Domain registration is subject to the rules and policies of the relevant registrar (e.g. ZACR for
                .co.za domains). IT-Guru Online acts as a reseller and cannot guarantee availability. Domains
                registered on your behalf remain your property subject to ongoing renewal fees.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">6. Limitation of Liability</h2>
              <p>
                IT-Guru Online shall not be liable for any indirect, incidental, or consequential damages arising
                from the use of our services. Our total liability in any matter shall not exceed the amount paid
                by you for the relevant service in the preceding three months.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">7. Intellectual Property</h2>
              <p>
                All content on this website, including text, graphics, logos, and software, is the property of
                IT-Guru Online or its content suppliers and is protected by applicable intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">8. Termination</h2>
              <p>
                Either party may terminate a service agreement with 30 days&apos; written notice. We reserve the
                right to terminate immediately in cases of material breach of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">9. Governing Law</h2>
              <p>
                These terms are governed by the laws of the Republic of South Africa. Any disputes shall be
                subject to the jurisdiction of the South African courts.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">10. Contact</h2>
              <p>
                For questions about these terms, please contact us:
              </p>
              <ul className="list-none pl-0 space-y-1 mt-2">
                <li>
                  <strong className="text-[var(--text-primary)]">IT-Guru Online</strong>
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
          </div>

          <div className="mt-10 pt-6 border-t border-[var(--border-color)]">
            <Link href="/" className="text-sm text-primary-700 hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
