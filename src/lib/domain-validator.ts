/**
 * Domain name validation utilities
 * RFC 1123 compliant domain label validation
 */

// Valid DNS label: starts/ends with alphanumeric, hyphens in middle, max 63 chars
const DOMAIN_LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export const SUPPORTED_TLDS = [
  ".co.za",
  ".com",
  ".net",
  ".org",
  ".online",
  ".africa",
] as const;

/**
 * The TLD shown as "Recommended" (primary) in the domain checker UI.
 * Change this to switch the default without touching components or API routes.
 */
export const PRIMARY_TLD: SupportedTld = ".co.za";

export type SupportedTld = (typeof SUPPORTED_TLDS)[number];

// RDAP server overrides for TLDs that have known endpoints.
// .africa endpoint comes from the IANA RDAP bootstrap (https://rdap.nic.africa/rdap/).
export const RDAP_SERVERS: Partial<Record<SupportedTld, string>> = {
  ".africa": "https://rdap.nic.africa/rdap/domain",
};

// Default fallback RDAP proxy (handles .com, .net, .org, .online via IANA bootstrap)
export const RDAP_PROXY = "https://rdap.org/domain";

/**
 * TLDs with no usable RDAP endpoint, resolved via DNS-over-HTTPS instead.
 *
 * `.za` (and therefore `.co.za`) is NOT published in the IANA RDAP bootstrap,
 * and ZA Central Registry exposes no public RDAP server reachable from a
 * serverless function — the old `rdap.registry.net.za` host returns 404 for
 * EVERY `.co.za` domain (registered or not), which made every result falsely
 * read as "available". A DNS NS lookup is the pragmatic signal: an unregistered
 * `.co.za` returns NXDOMAIN, a registered one returns its nameservers.
 *
 * `.online` is included too: its registry (centralnic) returns HTTP 403 to RDAP
 * queries from serverless IPs, which left every `.online` result stuck on
 * "Unknown". DNS gives a usable answer instead.
 *
 * Caveat: a registered-but-undelegated domain (no nameservers) can still return
 * NXDOMAIN and so read as available. This is rare for active domains and is far
 * more accurate than the previous always-available / always-unknown behaviour.
 */
export const DNS_LOOKUP_TLDS: readonly SupportedTld[] = [".co.za", ".online"];

export interface DomainValidation {
  valid: boolean;
  name: string; // sanitized name without TLD
  error?: string;
}

/**
 * Sanitize and validate a domain name input.
 * Strips protocol, www, and known TLD suffixes.
 * Returns { valid, name } — name is the bare label (e.g. "mycompany").
 */
export function validateDomainInput(input: string): DomainValidation {
  let name = input
    .trim()
    .toLowerCase()
    // strip protocol
    .replace(/^https?:\/\//i, "")
    // strip www prefix
    .replace(/^www\./i, "");

  // Strip any known TLD suffix so user can type "example.com" or just "example"
  for (const tld of SUPPORTED_TLDS) {
    if (name.endsWith(tld)) {
      name = name.slice(0, -tld.length);
      break;
    }
  }

  // Strip any remaining TLD/extension (unknown TLDs like .com.na, .africa, etc.)
  // Take only the first label — everything before the first dot
  const dotIndex = name.indexOf(".");
  if (dotIndex !== -1) {
    name = name.slice(0, dotIndex);
  }

  // Strip trailing dot
  name = name.replace(/\.$/, "");

  if (!name) {
    return { valid: false, name: "", error: "Please enter a domain name." };
  }

  if (name.length > 63) {
    return {
      valid: false,
      name,
      error: "Domain name must be 63 characters or fewer.",
    };
  }

  if (!DOMAIN_LABEL_RE.test(name)) {
    return {
      valid: false,
      name,
      error:
        "Domain name can only contain letters, numbers, and hyphens, and cannot start or end with a hyphen.",
    };
  }

  return { valid: true, name };
}
