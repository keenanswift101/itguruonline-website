import Link from "next/link";
import { CTAPanelBackground } from "@/components/ui/CTAPanelBackground";
import { Reveal } from "@/components/ui/Reveal";

export function CTABanner() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24" aria-label="Call to action">
      {/* Light-mode-only: soft ambient color wash behind the panel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(13,148,136,0.07), transparent 60%), radial-gradient(circle at 90% 100%, rgba(59,130,246,0.12), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal className="relative overflow-hidden rounded-2xl px-6 py-12 text-center sm:px-12 sm:py-16">
          <CTAPanelBackground />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-secondary-100">
              Check if your perfect domain is available and register today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/domain-checker"
                className="inline-flex items-center justify-center h-12 px-6 text-base font-medium rounded-[10px] bg-white text-secondary-700 hover:bg-secondary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-secondary-700"
              >
                Check Domain Availability
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center h-12 px-6 text-base font-medium rounded-[10px] border-2 border-white text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-secondary-700"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
