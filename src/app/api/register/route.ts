import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";
import { isTrustedOrigin } from "@/lib/csrf";
import { getClientIp } from "@/lib/client-ip";
import {
  validateStepA,
  validateStepB,
  validateStepC,
  validateStepD,
} from "@/lib/registration-validators";
import type { RegistrationFormData } from "@/lib/registration-types";
import { HOSTING_PACKAGES } from "@/lib/registration-types";
import { sendEmail, emailLayout, escapeHtml, ADMIN_EMAIL } from "@/lib/email";
import { db } from "@/lib/db/index";
import { clientRegistrations } from "@/lib/db/schema";

/** Strip HTML/script tags and dangerous URI schemes to prevent stored XSS */
function sanitize(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/\0/g, "") // strip null bytes
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
  // crypto.randomUUID() is cryptographically secure (available in Node.js ≥ 19 and all edge runtimes)
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 5).toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

export async function POST(req: NextRequest) {
  // ── CSRF defense-in-depth ───────────────────────────────────────────────
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  // ── Rate limiting ──────────────────────────────────────────────────────
  const ip = getClientIp(req);
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

  // CRM capture — MUST precede email send (so capture survives an email failure)
  try {
    await db.insert(clientRegistrations).values({
      referenceId,
      status: "new",
      firstName: clean.stepA.firstName,
      surname: clean.stepA.surname,
      email: clean.stepA.email,
      cellPhone: clean.stepA.cellPhone,
      telephone: clean.stepA.telephone,
      physicalAddress: clean.stepA.physicalAddress,
      postalAddress: clean.stepA.postalAddress,
      domainName: clean.stepB.domainName,
      nameserver1: clean.stepB.nameserver1,
      nameserver2: clean.stepB.nameserver2,
      hostingPackage: clean.stepC.hostingPackage,
      domainRegistration: clean.stepC.domainRegistration,
      sslCertificate: clean.stepC.sslCertificate,
      emailHosting: clean.stepC.emailHosting,
      websiteDesign: clean.stepC.websiteDesign,
      additionalServices: clean.stepC.additionalServices,
      termsAccepted: clean.stepD.termsAccepted,
      signature: clean.stepD.signature,
      signatureDate: clean.stepD.signatureDate,
    });
  } catch (err) {
    // Intentional trade-off: prioritise the user's confirmation over perfect capture.
    // A transient DB error must not make a successful registration disappear for the user.
    console.error("[register] DB insert failed:", err);
  }

  // ── Send confirmation email to client + notification to admin ──────────
  const hostingPackageName =
    HOSTING_PACKAGES.find((p) => p.id === clean.stepC.hostingPackage)?.name ?? "None selected";

  const selectedExtras = [
    clean.stepC.domainRegistration && "Domain Registration",
    clean.stepC.sslCertificate && "SSL Certificate",
    clean.stepC.emailHosting && "Email Hosting",
    clean.stepC.websiteDesign && "Website Design",
  ].filter(Boolean) as string[];

  await sendEmail({
    to: clean.stepA.email,
    subject: `Your IT-Guru Online registration — ${referenceId}`,
    html: emailLayout(
      `Thanks for registering, ${escapeHtml(clean.stepA.firstName)}!`,
      `
        <p>We've received your application for <strong>${escapeHtml(clean.stepB.domainName)}</strong>.</p>
        <p>Your reference number is <strong>${referenceId}</strong> — please quote this in any correspondence with us.</p>
        <p><strong>Hosting Package:</strong> ${escapeHtml(hostingPackageName)}</p>
        ${selectedExtras.length ? `<p><strong>Add-ons:</strong> ${selectedExtras.map(escapeHtml).join(", ")}</p>` : ""}
        <p>We'll be in touch within one business day to confirm next steps.</p>
      `
    ),
  });

  await sendEmail({
    to: ADMIN_EMAIL,
    replyTo: clean.stepA.email,
    subject: `[Registration] New application — ${referenceId}`,
    html: emailLayout(
      "New Registration Application",
      `
        <p><strong>Reference:</strong> ${referenceId}</p>
        <p><strong>Name:</strong> ${escapeHtml(clean.stepA.firstName)} ${escapeHtml(clean.stepA.surname)}</p>
        <p><strong>Email:</strong> ${escapeHtml(clean.stepA.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(clean.stepA.cellPhone)}</p>
        <p><strong>Physical Address:</strong> ${escapeHtml(clean.stepA.physicalAddress)}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <p><strong>Domain:</strong> ${escapeHtml(clean.stepB.domainName)}</p>
        <p><strong>Hosting Package:</strong> ${escapeHtml(hostingPackageName)}</p>
        ${selectedExtras.length ? `<p><strong>Add-ons:</strong> ${selectedExtras.map(escapeHtml).join(", ")}</p>` : ""}
        ${clean.stepC.additionalServices ? `<p><strong>Additional Services:</strong> ${escapeHtml(clean.stepC.additionalServices)}</p>` : ""}
      `
    ),
  });

  // Reference logged only to stderr in non-production environments
  if (process.env.NODE_ENV !== "production") {
    console.log(`[register] New application submitted. Ref: ${referenceId}`);
  }

  return NextResponse.json({ referenceId }, { status: 201 });
}
