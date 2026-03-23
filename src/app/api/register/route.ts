import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";
import {
  validateStepA,
  validateStepB,
  validateStepC,
  validateStepD,
} from "@/lib/registration-validators";
import type { RegistrationFormData } from "@/lib/registration-types";

/** Strip HTML/script tags to prevent stored XSS */
function sanitize(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

function sanitizeAll(data: RegistrationFormData): RegistrationFormData {
  return {
    stepA: {
      firstName: sanitize(data.stepA.firstName),
      surname: sanitize(data.stepA.surname),
      physicalAddress: sanitize(data.stepA.physicalAddress),
      postalAddress: sanitize(data.stepA.postalAddress),
      telephone: sanitize(data.stepA.telephone),
      cellPhone: sanitize(data.stepA.cellPhone),
      email: sanitize(data.stepA.email).toLowerCase(),
    },
    stepB: {
      domainName: sanitize(data.stepB.domainName).toLowerCase(),
      nameserver1: sanitize(data.stepB.nameserver1),
      nameserver2: sanitize(data.stepB.nameserver2),
    },
    stepC: {
      hostingPackage: data.stepC.hostingPackage,
      domainRegistration: Boolean(data.stepC.domainRegistration),
      sslCertificate: Boolean(data.stepC.sslCertificate),
      emailHosting: Boolean(data.stepC.emailHosting),
      websiteDesign: Boolean(data.stepC.websiteDesign),
      additionalServices: sanitize(data.stepC.additionalServices ?? ""),
    },
    stepD: {
      termsAccepted: Boolean(data.stepD.termsAccepted),
      signature: sanitize(data.stepD.signature),
      signatureDate: sanitize(data.stepD.signatureDate),
    },
  };
}

function generateReferenceId(): string {
  const prefix = "ITG";
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `${prefix}-${datePart}-${randomPart}`;
}

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const rl = checkRateLimit(`register:${ip}`);

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

  if (
    typeof body !== "object" ||
    body === null ||
    !("stepA" in body) ||
    !("stepB" in body) ||
    !("stepC" in body) ||
    !("stepD" in body)
  ) {
    return NextResponse.json({ error: "Incomplete form data." }, { status: 400 });
  }

  const raw = body as RegistrationFormData;

  // ── Server-side validation (mirrors client-side) ───────────────────────
  const errorsA = validateStepA(raw.stepA);
  const errorsB = validateStepB(raw.stepB);
  const errorsC = validateStepC(raw.stepC);
  const errorsD = validateStepD(raw.stepD);

  const allErrors = { ...errorsA, ...errorsB, ...errorsC, ...errorsD };
  if (Object.keys(allErrors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", fields: allErrors }, { status: 422 });
  }

  // ── Sanitize ───────────────────────────────────────────────────────────
  const clean = sanitizeAll(raw);

  // ── Generate reference ID ──────────────────────────────────────────────
  const referenceId = generateReferenceId();

  // ── TODO: Persist to DB (Supabase) ────────────────────────────────────
  // When DATABASE_URL/SUPABASE_URL is configured, insert here:
  // await supabase.from("registrations").insert({ reference_id: referenceId, ...clean, created_at: new Date() });

  // ── TODO: Send confirmation email (Resend/SendGrid) ────────────────────
  // await sendConfirmationEmail({ to: clean.stepA.email, name: clean.stepA.firstName, referenceId });
  // await sendAdminNotification({ referenceId, data: clean });

  // Log reference (server-side only, never expose PII to logs in production)
  console.log(`[register] New application submitted. Ref: ${referenceId}`);

  return NextResponse.json({ referenceId }, { status: 201 });
}
