import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isTrustedOrigin } from "@/lib/csrf";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
