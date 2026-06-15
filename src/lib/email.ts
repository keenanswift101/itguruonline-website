import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "info@it-guru.co.za";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "IT-Guru Online <info@it-guru.co.za>";

/** Escapes HTML special characters to prevent injection into email markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Wraps body content in a minimal branded HTML shell shared by all outgoing emails. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1a1a; line-height: 1.6;">
    <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0f4c81; margin-bottom: 16px;">${title}</h2>
      ${bodyHtml}
      <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #6b7280;">IT-Guru Online &middot; Kuils River, Western Cape &middot; info@it-guru.co.za</p>
    </div>
  </body>
</html>`;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Sends an email via Resend. Failures are logged but never thrown — a missing
 * notification shouldn't fail the form submission it's attached to.
 */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping send.");
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}
