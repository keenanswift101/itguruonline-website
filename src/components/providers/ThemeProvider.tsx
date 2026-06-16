"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// useLayoutEffect on the client (runs before paint, avoiding a flash);
// falls back to useEffect on the server to avoid the SSR warning.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start at "light" so the client's first render matches the
  // server-rendered HTML. The layout effect below corrects this from the
  // anti-FOUC inline script's <html data-theme> before the browser paints.
  const [theme, setTheme] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme") as Theme | null;
    if (attr === "dark" || attr === "light") setTheme(attr);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme, hydrated]);

  // Sync theme across browser tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "theme" && (e.newValue === "light" || e.newValue === "dark")) {
        setTheme(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
