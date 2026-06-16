import Image from "next/image";
import { Hero } from "@/components/sections/Hero";
import { ServiceCards } from "@/components/sections/ServiceCards";
import { TechStack } from "@/components/sections/TechStack";
import { Values } from "@/components/sections/Values";
import { CTABanner } from "@/components/sections/CTABanner";
export default function HomePage() {
  return (
    <div className="relative">
      {/* Full-page fixed background */}
      <div className="fixed inset-0 -z-10">
        <Image src="/bg-image.jpg" alt="" fill className="object-cover object-center" aria-hidden="true" priority />
      </div>
      <Hero />
      <ServiceCards />
      <TechStack />
      <Values />
      <CTABanner />
    </div>
  );
}
