import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "IT-Guru Online's Privacy Policy — how we collect, use, and protect your personal information in accordance with the Protection of Personal Information Act (POPIA).",
};

export default function PrivacyPage() {
  const updated = "23 March 2026";

  return (
    <div className="relative overflow-hidden min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image src="/bg-image.jpg" alt="" fill className="object-cover object-center" aria-hidden="true" priority />
        <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-hidden="true" />
      </div>

      {/* Hero banner */}
      <section className="relative overflow-hidden py-10 sm:py-14" aria-label="Privacy policy hero">
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
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Privacy Policy</h1>
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
              <h2 className="text-lg font-semibold text-(--text-primary) mt-0">1. Introduction</h2>
              <p>
                IT-Guru Online (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting the personal
                information of our clients and website visitors in accordance with the{" "}
                <strong className="text-(--text-primary)">Protection of Personal Information Act 4 of 2013 (POPIA)</strong>.
                This policy explains what information we collect, why we collect it, and how we use it.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">2. Information We Collect</h2>
              <p>We may collect the following personal information:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Full name and surname</li>
                <li>Email address and telephone number</li>
                <li>Physical and postal address</li>
                <li>Service preferences and domain registration details</li>
                <li>Communication records (contact form submissions, emails)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">3. How We Use Your Information</h2>
              <p>We use your personal information to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Process service registrations and domain applications</li>
                <li>Communicate with you about your account or enquiry</li>
                <li>Provide IT support and related services</li>
                <li>Comply with legal obligations</li>
                <li>Improve our website and service offerings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">4. Sharing of Information</h2>
              <p>
                We will <strong className="text-(--text-primary)">not</strong> sell, rent, or share your personal information
                with third parties except where required to deliver our services (e.g. domain registrars, hosting
                infrastructure providers) or where required by law. All third parties we work with are contractually
                obligated to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">5. Data Retention</h2>
              <p>
                We retain personal information only for as long as necessary to fulfil the purposes for which it was
                collected, or as required by law. You may request deletion of your data at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">6. Your Rights Under POPIA</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to the processing of your information</li>
                <li>Lodge a complaint with the Information Regulator</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">7. Security</h2>
              <p>
                We implement appropriate technical and organisational measures to protect your personal information
                against unauthorised access, disclosure, alteration, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--text-primary)">8. Contact Us</h2>
              <p>
                For any privacy-related enquiries or to exercise your rights, please contact our Information Officer:
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
