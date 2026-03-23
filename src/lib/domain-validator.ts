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

export type SupportedTld = (typeof SUPPORTED_TLDS)[number];

// RDAP server overrides for TLDs that have known endpoints
export const RDAP_SERVERS: Partial<Record<SupportedTld, string>> = {
  ".co.za": "https://rdap.registry.net.za/domain",
  ".africa": "https://rdap.registry.africa/domain",
};

// Default fallback RDAP proxy (handles .com, .net, .org, .online via IANA bootstrap)
export const RDAP_PROXY = "https://rdap.org/domain";

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
