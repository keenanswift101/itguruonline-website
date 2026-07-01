import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isTrustedOrigin } from "@/lib/csrf";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit } from "@/lib/rate-limiter";
import { createResetToken } from "@/lib/auth";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";

const ForgotSchema = z.object({
  email: z.string().email(),
});

// Reset link always goes to the confirmed admin mailbox (D-03), never to the form email.
const RESET_RECIPIENT = "ambrose@it-guru.co.za";

export async function POST(req: NextRequest) {
  // 1. CSRF origin check
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. In-memory rate limit (prevents email-bombing from one IP)
  const ip = getClientIp(req);
  const rl = checkRateLimit(`forgot:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // 3. Parse body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 4. Validate
  const parsed = ForgotSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  // 5. Generate reset token (returns null if no matching admin — no enumeration)
  const rawToken = await createResetToken(email);

  // 6. Email the reset link to the fixed recipient (D-03)
  if (rawToken) {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://it-guru.co.za";
    const resetUrl = `${base}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;
    const safeUrl = escapeHtml(resetUrl);

    const bodyHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:16px; font-size:14px; line-height:1.65; color:#334155;">
            A password reset was requested for the IT-Guru admin portal.
            Click the button below to set a new password. This link expires in 1 hour.
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 0 24px 0;">
            <a href="${safeUrl}"
               style="display:inline-block; background-color:#1e3a8a; color:#ffffff;
                      font-size:14px; font-weight:600; text-decoration:none;
                      padding:12px 28px; border-radius:8px;">
              Reset Password
            </a>
          </td>
        </tr>
        <tr>
          <td style="font-size:12px; color:#64748b; word-break:break-all;">
            Or copy this link: <a href="${safeUrl}" style="color:#1e3a8a;">${safeUrl}</a>
          </td>
        </tr>
        <tr>
          <td style="padding-top:20px; font-size:12px; color:#94a3b8;">
            If you didn&apos;t request this, you can safely ignore this email.
          </td>
        </tr>
      </table>`;

    await sendEmail({
      to: RESET_RECIPIENT,
      subject: "IT-Guru Admin — Password Reset",
      html: emailLayout("Reset your IT-Guru admin password", bodyHtml),
    });
  }

  // 7. Always return the same 200 (no account enumeration)
  return NextResponse.json({ ok: true });
}
