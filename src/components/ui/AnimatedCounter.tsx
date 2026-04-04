"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({
  end,
  suffix = "",
  duration = 2000,
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Start counting only when the element scrolls into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animate from 0 → end with cubic ease-out
  useEffect(() => {
    if (!started) return;

    // Skip animation for users who prefer reduced motion
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setCount(end);
      return;
    }

    const isDecimal = end % 1 !== 0;
    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out for a snappy ramp + smooth finish
      const eased = 1 - Math.pow(1 - progress, 3);

      setCount(
        isDecimal
          ? parseFloat((eased * end).toFixed(1))
          : Math.floor(eased * end)
      );

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [started, end, duration]);

  return (
    <span ref={ref}>
      {/* Animated visual — hidden from screen readers during count-up */}
      <span aria-hidden="true">
        {count}
        {suffix}
      </span>
      {/* Static value always accessible to screen readers */}
      <span className="sr-only">
        {end}
        {suffix}
      </span>
    </span>
  );
}
