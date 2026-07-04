import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isTrustedOrigin } from "@/lib/csrf";
import { requireAdmin, changePassword } from "@/lib/auth";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  // 1. CSRF origin check
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Require an active admin session
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Parse body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 4. Validate
  const parsed = ChangePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // 5. Verify current password and set the new one
  const ok = await changePassword(session.sub, parsed.data.currentPassword, parsed.data.newPassword);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
