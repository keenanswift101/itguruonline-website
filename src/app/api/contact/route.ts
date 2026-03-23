import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";

interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/** Strip HTML tags and javascript: protocol to prevent stored XSS */
function sanitize(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

function validateContact(data: ContactPayload): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) errors.name = "Name is required.";
  else if (data.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";

  if (!data.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (data.phone) {
    const cleanPhone = data.phone.replace(/[\s\-().]/g, "");
    if (cleanPhone && !/^(\+27|27|0)[1-9]\d{8}$/.test(cleanPhone)) {
      errors.phone = "Enter a valid South African phone number.";
    }
  }

  if (!data.subject.trim()) errors.subject = "Please select a subject.";

  if (!data.message.trim()) {
    errors.message = "Message is required.";
  } else if (data.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters.";
  } else if (data.message.trim().length > 2000) {
    errors.message = "Message must be under 2000 characters.";
  }

  return errors;
}

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const rl = checkRateLimit(`contact:${ip}`);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const raw = body as Partial<ContactPayload>;

  const payload: ContactPayload = {
    name: sanitize(String(raw.name ?? "")),
    email: sanitize(String(raw.email ?? "")).toLowerCase(),
    phone: raw.phone ? sanitize(String(raw.phone)) : undefined,
    subject: sanitize(String(raw.subject ?? "")),
    message: sanitize(String(raw.message ?? "")),
  };

  // ── Validate ───────────────────────────────────────────────────────────
  const errors = validateContact(payload);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", fields: errors }, { status: 422 });
  }

  // ── TODO: Send email notification ─────────────────────────────────────
  // When EMAIL_API_KEY is configured:
  // await sendEmail({
  //   to: process.env.ADMIN_EMAIL ?? "info@it-guru.co.za",
  //   replyTo: payload.email,
  //   subject: `[IT-Guru Contact] ${payload.subject} — from ${payload.name}`,
  //   body: payload.message,
  // });

  // Server-side log (no PII in production logs)
  console.log(`[contact] New message received. Subject: ${payload.subject}`);

  return NextResponse.json(
    { message: "Thank you! Your message has been received. We will respond within one business day." },
    { status: 200 }
  );
}
