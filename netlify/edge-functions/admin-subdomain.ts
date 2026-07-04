import type { Config } from "@netlify/edge-functions";

// Serves the admin portal at admin.it-guru.co.za with clean URLs
// (admin.it-guru.co.za/invoices instead of /admin/invoices), while the
// main domain keeps working exactly as before. A standalone Netlify Edge
// Function (Deno, outside the Next.js build) rather than Next.js
// middleware -- middleware was already removed from this project because
// Next.js 16 + Turbopack emits chunks Netlify's edge bundler can't
// resolve (see PROVISIONING-NOTES.md).
export default async (request: Request) => {
  const url = new URL(request.url);

  if (url.hostname !== "admin.it-guru.co.za") {
    return; // main domain: pass through unchanged
  }

  const path = url.pathname;

  const isAlreadyNamespaced =
    path.startsWith("/admin") ||
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    /\.[a-zA-Z0-9]+$/.test(path); // static assets (favicon.png, robots.txt, images, etc.)

  if (isAlreadyNamespaced) {
    return; // pass through unchanged
  }

  const target = path === "/" ? "/admin/dashboard" : `/admin${path}`;
  return new URL(target, url); // rewrite -- URL bar stays on admin.it-guru.co.za
};

export const config: Config = { path: "/*" };
