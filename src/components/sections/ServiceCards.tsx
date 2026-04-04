"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

const services: { title: string; description: string }[] = [
  {
    title: "Remote / Online Support",
    description:
      "Secure remote connections for diagnostics, software fixes, and patches — anywhere in the world.",
  },
  {
    title: "Network Solutions",
    description:
      "Routers, switches, ethernet cabling, and WiFi solutions tailored to your business needs.",
  },
  {
    title: "Hardware Procurement",
    description:
      "All major brands — custom-built desktops, servers, laptops, printers, and peripherals.",
  },
  {
    title: "Troubleshooting & Repairs",
    description:
      "Hardware troubleshooting, desktop upgrades, laptop repairs, and system optimisation.",
  },
  {
    title: "Web Hosting & Domains",
    description:
      "Domain registration, Windows & Linux hosting, and full web hosting management.",
  },
  {
    title: "Web Design",
    description:
      "Professional website design and development through our Swift Designz partnership.",
  },
];

const SLIDE_MS = 580;     // wait for card slide-in transition
const TYPE_SPEED_MS = 48; // ms per character — deliberate, readable pace
const CARD_GAP_MS = 200;  // pause between cards

export function ServiceCards() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // visible[i] = true once card i has slid in
  const [visible, setVisible] = useState<boolean[]>(
    () => Array(services.length).fill(false),
  );
  // typedLen[i] = how many characters have been revealed for card i
  const [typedLen, setTypedLen] = useState<number[]>(
    () => Array(services.length).fill(0),
  );
  // activeCard = which card is currently typing (-1 = none)
  const [activeCard, setActiveCard] = useState(-1);

  const sectionRef = useRef<HTMLElement>(null);
  const triggered = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    function typeCard(cardIdx: number, charIdx: number, onDone: () => void) {
      // Write a single character — functional update avoids stale closure
      setTypedLen((prev) => {
        const next = [...prev];
        next[cardIdx] = charIdx + 1;
        return next;
      });
      if (charIdx + 1 < services[cardIdx].description.length) {
        const t = setTimeout(
          () => typeCard(cardIdx, charIdx + 1, onDone),
          TYPE_SPEED_MS,
        );
        timers.current.push(t);
      } else {
        setActiveCard(-1);
        onDone();
      }
    }

    function runCard(i: number) {
      if (i >= services.length) return;
      // Make card visible (slide in)
      setVisible((prev) => {
        const next = [...prev];
        next[i] = true;
        return next;
      });
      // After slide, start typing
      const t = setTimeout(() => {
        setActiveCard(i);
        typeCard(i, 0, () => {
          const gap = setTimeout(() => runCard(i + 1), CARD_GAP_MS);
          timers.current.push(gap);
        });
      }, SLIDE_MS);
      timers.current.push(t);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || triggered.current) return;
        triggered.current = true;
        runCard(0);
      },
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-16 sm:py-24 overflow-hidden bg-(--bg-secondary)"
    >
      {/* Dark-mode-only: metallic gradient base */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            "linear-gradient(160deg, #0d1117 0%, #111827 30%, #0f1f1a 60%, #0a1628 100%)",
        }}
      />
      {/* Dark-mode-only: teal/blue sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            "linear-gradient(105deg, rgba(13,148,136,0.06) 0%, transparent 40%, rgba(30,58,138,0.05) 70%, transparent 100%)",
        }}
      />
      {/* Dark-mode-only: top edge rim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px hidden dark:block"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(13,148,136,0.4), transparent)",
        }}
      />
      {/* Light-mode-only: subtle top rule */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-(--border-color) dark:hidden"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
            IT-Guru.Online
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-(--text-primary) sm:text-4xl">
            How Can We Help?
          </h2>
          <p className="mt-4 text-lg text-(--text-secondary)">
            Retain your core focus — our IT support frees up your time and
            resources.
          </p>
        </div>

        {/* Cards grid — ALL cards always in DOM, opacity/transform only */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const isVisible = visible[i];
            const typed = service.description.slice(0, typedLen[i]);
            const isTyping = activeCard === i;

            return (
              <div
                key={service.title}
                className="relative rounded-2xl p-6"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateX(0)" : "translateX(72px)",
                  transition:
                    "opacity 0.55s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
                  ...(isDark
                    ? {
                        /* Dark: liquid glass surface */
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 50%, rgba(13,148,136,0.04) 100%)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderTop: "1px solid rgba(255,255,255,0.18)",
                        borderLeft: "1px solid rgba(255,255,255,0.12)",
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.15), 0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)",
                      }
                    : {
                        /* Light: clean card */
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-color)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                      }),
                }}
              >
                {/* Card number badge */}
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-primary-600 dark:text-primary-400 mb-4 select-none"
                  style={{
                    background: isDark ? "rgba(13,148,136,0.12)" : "rgba(13,148,136,0.08)",
                    border: isDark
                      ? "1px solid rgba(13,148,136,0.22)"
                      : "1px solid rgba(13,148,136,0.18)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 className="text-base font-semibold text-(--text-primary) leading-snug">
                  {service.title}
                </h3>

                {/* Cursor always in DOM — visibility toggled, never mounted/unmounted */}
                <p className="mt-2 text-sm text-(--text-secondary) leading-relaxed min-h-18">
                  {typed}
                  <span
                    aria-hidden="true"
                    style={{ visibility: isTyping ? "visible" : "hidden" }}
                    className="inline-block w-0.5 h-[0.85em] bg-primary-400 align-middle ml-px animate-pulse"
                  />
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
