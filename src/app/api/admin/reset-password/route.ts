import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isTrustedOrigin } from "@/lib/csrf";
import { consumeResetToken } from "@/lib/auth";

const ResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  // 1. CSRF origin check
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Parse body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 3. Validate
  const parsed = ResetSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // 4. Consume the reset token and set new password
  const ok = await consumeResetToken(parsed.data.token, parsed.data.password);

  if (!ok) {
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
