import type { NextConfig } from "next";

// Only external origins this site actually loads resources from:
// - Google Maps embed (iframe) on the Contact page
// - flagcdn.com flag images on the registration form's country picker
//
// 'unsafe-eval' is added to script-src ONLY in development — Next.js/Turbopack's
// dev error overlay + React dev tooling use eval() (e.g. to reconstruct call
// stacks). Production NEVER gets 'unsafe-eval' (React doesn't use eval in prod),
// so this is a dev-only convenience with no production security impact.
const isDev = process.env.NODE_ENV === "development";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://flagcdn.com",
  "font-src 'self' data:",
  "frame-src https://maps.google.com https://www.google.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // `pg` is only used by the local-dev DB driver branch (NETLIFY_DB_DRIVER=
  // "server", injected by `netlify dev`). Keeping it external stops Turbopack
  // from bundling/mangling it in deployed functions — the failure mode that
  // forced @netlify/database out of this project.
  serverExternalPackages: ["pg"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
