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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://it-guru.co.za";
const LOGO_URL = `${BASE_URL}/FullLogo_Transparent.png`;
const SIGNATURE_BG_URL = `${BASE_URL}/footer_bg.png`;

/**
 * Wraps body content in a branded HTML shell shared by all outgoing emails.
 *
 * Built table-based with every style declared inline — webmail clients
 * (Outlook desktop, Gmail, Yahoo, Apple Mail) strip <style> blocks and don't
 * support flexbox/grid, so this intentionally avoids both to render
 * consistently everywhere.
 */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#0b1220; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b1220;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden;">
            <!-- Header banner -->
            <tr>
              <td align="center" style="background-color:#1e3a8a; padding:28px 24px;">
                <img src="${LOGO_URL}" width="168" alt="IT-Guru Online" style="display:block; border:0; outline:none; text-decoration:none; max-width:168px;" />
              </td>
            </tr>
            <!-- Title -->
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <h1 style="margin:0; font-size:20px; line-height:1.3; color:#0f172a; font-family:-apple-system,Helvetica,Arial,sans-serif;">${title}</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:8px 32px 32px 32px; font-size:14px; line-height:1.65; color:#334155;">
                ${bodyHtml}
              </td>
            </tr>
            <!-- Divider -->
            <tr>
              <td style="padding:0 32px;">
                <hr style="border:none; border-top:1px solid #e2e8f0; margin:0;" />
              </td>
            </tr>
            <!-- Signature — footer_bg image, with a solid navy fallback for clients that block images -->
            <tr>
              <td
                background="${SIGNATURE_BG_URL}"
                style="background-color:#0b1220; background-image:url('${SIGNATURE_BG_URL}'); background-size:cover; background-position:center; padding:24px 32px 32px 32px;"
              >
                <!--[if gte mso 9]>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:496px;">
                  <v:fill type="frame" src="${SIGNATURE_BG_URL}" color="#0b1220" />
                  <v:textbox inset="0,0,0,0">
                <![endif]-->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:13px; color:#ffffff; font-weight:700;">IT-Guru Online</td>
                  </tr>
                  <tr>
                    <td style="font-size:11px; color:#2dd4bf; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; padding-top:2px;">
                      Your IT Needs, Our Priority
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:12px; color:#cbd5e1; padding-top:10px; line-height:1.7;">
                      Kuils River, Western Cape, South Africa<br />
                      <a href="mailto:info@it-guru.co.za" style="color:#7dd3fc; text-decoration:none;">info@it-guru.co.za</a>
                      &middot;
                      <a href="tel:+27729627608" style="color:#7dd3fc; text-decoration:none;">+27 72 962 7608</a><br />
                      <a href="${BASE_URL}" style="color:#7dd3fc; text-decoration:none;">it-guru.co.za</a>
                    </td>
                  </tr>
                </table>
                <!--[if gte mso 9]>
                  </v:textbox>
                </v:rect>
                <![endif]-->
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
            <tr>
              <td align="center" style="padding:16px 8px; font-size:11px; color:#64748b;">
                You're receiving this email because of an enquiry or application submitted at it-guru.co.za.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

// Every outgoing email is BCC'd to the business inbox (owner requirement:
// IT-Guru must have a copy of all automation + transactional mail). Skipped
// when the copy address is already a direct recipient. Override with
// EMAIL_BCC_COPY; set it to "off" to disable entirely.
const BCC_COPY_ADDRESS = process.env.EMAIL_BCC_COPY ?? "info@it-guru.co.za";

function bccCopyFor(to: string | string[]): string | undefined {
  if (BCC_COPY_ADDRESS.toLowerCase() === "off") return undefined;
  const recipients = (Array.isArray(to) ? to : [to]).map((r) => r.toLowerCase());
  if (recipients.includes(BCC_COPY_ADDRESS.toLowerCase())) return undefined;
  return BCC_COPY_ADDRESS;
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

  const bcc = bccCopyFor(to);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      ...(bcc ? { bcc } : {}),
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}
