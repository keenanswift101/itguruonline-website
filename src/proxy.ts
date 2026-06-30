import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// SMOKE TEST ONLY (Plan 01). Replaced with real session-check logic in Plan 03.
// Proves proxy.ts fires under @netlify/plugin-nextjs before real auth is built on it.
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/smoke-test") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
