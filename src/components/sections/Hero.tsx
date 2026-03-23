import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DomainChecker } from "@/components/forms/DomainChecker";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Your Trusted{" "}
          <span className="text-primary-700">IT Partner</span> in South Africa
        </h1>
        <p className="mt-6 text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
          From domain registration and web hosting to network solutions and
          remote support — IT-Guru Online has you covered.
        </p>

        {/* Inline domain checker */}
        <div className="mt-10 max-w-2xl mx-auto text-left">
          <p className="mb-3 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide text-center">
            Search for your domain
          </p>
          <DomainChecker />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/services">
            <Button variant="secondary" size="lg">
              View Services
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost" size="lg">
              Get in Touch
            </Button>
          </Link>
        </div>
      </div>

      {/* Decorative gradient */}
      <div
        className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary-500/10 to-transparent lg:block pointer-events-none"
        aria-hidden="true"
      />
    </section>
  );
}
