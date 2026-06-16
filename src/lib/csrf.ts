/**
 * Lightweight CSRF defense-in-depth for state-changing API routes.
 *
 * This site has no session/cookie-based authentication, so classic CSRF
 * (which relies on a victim's ambient credentials) has low real impact —
 * a forged cross-site POST can only submit a form anonymously, the same
 * as any visitor could do directly. This check still blocks the cheap
 * drive-by case: a third-party page silently auto-submitting one of our
 * forms in the background.
 */
export function isTrustedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  // Some same-site requests legitimately omit Origin — don't block those,
  // only reject when an Origin is present and it doesn't match our host.
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.get("host");
    return originHost === requestHost;
  } catch {
    return false;
  }
}
