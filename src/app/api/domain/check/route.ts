import { NextRequest, NextResponse } from "next/server";
import {
  validateDomainInput,
  SUPPORTED_TLDS,
  PRIMARY_TLD,
  RDAP_SERVERS,
  RDAP_PROXY,
  type SupportedTld,
} from "@/lib/domain-validator";
import { checkRateLimit } from "@/lib/rate-limiter";
import { isTrustedOrigin } from "@/lib/csrf";
import { getClientIp } from "@/lib/client-ip";

export interface TldResult {
  domain: string;
  tld: string;
  available: boolean;
  error?: string;
}

export interface DomainCheckResponse {
  primary: TldResult;
  alternatives: TldResult[];
}

/**
 * Query RDAP for a single domain.
 * RDAP returns 404 when the domain is NOT in the registry (i.e. available).
 * RDAP returns 200 when the domain IS registered (i.e. taken).
 */
async function checkOneTld(name: string, tld: SupportedTld): Promise<TldResult> {
  const domain = `${name}${tld}`;
  const base = RDAP_SERVERS[tld] ?? RDAP_PROXY;
  const rdapUrl = `${base}/${domain}`;

  try {
    const res = await fetch(rdapUrl, {
      method: "GET",
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/rdap+json, application/json" },
      // Ensure no sensitive data leaks through redirects
      redirect: "follow",
    });

    // 200 = domain registered = TAKEN
    // 404 = domain not in registry = AVAILABLE
    // Other status codes = treat as uncertain / lookup failed
    if (res.status === 200) {
      return { domain, tld, available: false };
    }
    if (res.status === 404) {
      return { domain, tld, available: true };
    }

    // 400 = malformed query, 422 = unprocessable — treat as unavailable/unknown
    return { domain, tld, available: false, error: "lookup-uncertain" };
  } catch {
    // Timeout or network failure — don't expose internal error details
    return { domain, tld, available: false, error: "lookup-failed" };
  }
}

export async function POST(req: NextRequest) {
  // ── CSRF defense-in-depth ───────────────────────────────────────────────────
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.resetInMs / 1000)),
        },
      }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("domain" in body) ||
    typeof (body as Record<string, unknown>).domain !== "string"
  ) {
    return NextResponse.json(
      { error: "Request must include a domain field." },
      { status: 400 }
    );
  }

  const rawDomain = (body as Record<string, string>).domain;

  // ── Validate & sanitize ───────────────────────────────────────────────────
  const validation = validateDomainInput(rawDomain);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // ── RDAP lookups — all TLDs in parallel ───────────────────────────────────
  // PRIMARY_TLD is the "Recommended" result; remaining TLDs are alternatives.
  // To change the default, update PRIMARY_TLD in src/lib/domain-validator.ts.
  const altTlds = SUPPORTED_TLDS.filter((t) => t !== PRIMARY_TLD) as SupportedTld[];

  const [primary, ...alternatives] = await Promise.all([
    checkOneTld(validation.name, PRIMARY_TLD),
    ...altTlds.map((tld) => checkOneTld(validation.name, tld)),
  ]);

  const response: DomainCheckResponse = { primary, alternatives };

  return NextResponse.json(response, {
    headers: {
      "X-RateLimit-Remaining": String(rl.remaining),
    },
  });
}
