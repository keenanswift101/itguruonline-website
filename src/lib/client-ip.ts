/**
 * Resolves the real client IP for rate-limiting purposes.
 *
 * Prefers Netlify's own `x-nf-client-connection-ip` header, which Netlify's
 * edge sets itself from the actual TCP connection and cannot be spoofed by
 * the client. Falls back to the first `x-forwarded-for` entry (which IS
 * client-controllable if a request ever reaches this code outside Netlify's
 * edge, e.g. local dev) so rate limiting still degrades gracefully rather
 * than failing open.
 */
export function getClientIp(req: Request): string {
  const nfIp = req.headers.get("x-nf-client-connection-ip");
  if (nfIp) return nfIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
