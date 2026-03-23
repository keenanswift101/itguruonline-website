/**
 * Registration form types and client-side validation
 * Mirrors server-side validation in /api/register/route.ts
 */

// ── Section A ──────────────────────────────────────────────────────────────
export interface StepAData {
  firstName: string;
  surname: string;
  idPassport: string;
  physicalAddress: string;
  postalAddress: string;
  telephone: string;
  cellPhone: string;
  email: string;
}

// ── Section B ──────────────────────────────────────────────────────────────
export interface StepBData {
  domainName: string;
  nameserver1: string;
  nameserver2: string;
}

// ── Section C ──────────────────────────────────────────────────────────────
export type HostingPackage = "starter" | "business" | "professional" | "";

export interface StepCData {
  hostingPackage: HostingPackage;
  domainRegistration: boolean;
  sslCertificate: boolean;
  emailHosting: boolean;
  websiteDesign: boolean;
  additionalServices: string;
}

// ── Section D ──────────────────────────────────────────────────────────────
export interface StepDData {
  termsAccepted: boolean;
  signature: string; // typed full name as digital signature
  signatureDate: string; // ISO date string, auto-populated
}

// ── Full form ──────────────────────────────────────────────────────────────
export interface RegistrationFormData {
  stepA: StepAData;
  stepB: StepBData;
  stepC: StepCData;
  stepD: StepDData;
}

// ── Defaults ───────────────────────────────────────────────────────────────
export const defaultStepA: StepAData = {
  firstName: "",
  surname: "",
  idPassport: "",
  physicalAddress: "",
  postalAddress: "",
  telephone: "",
  cellPhone: "",
  email: "",
};

export const defaultStepB: StepBData = {
  domainName: "",
  nameserver1: "",
  nameserver2: "",
};

export const defaultStepC: StepCData = {
  hostingPackage: "",
  domainRegistration: true,
  sslCertificate: false,
  emailHosting: false,
  websiteDesign: false,
  additionalServices: "",
};

export const defaultStepD: StepDData = {
  termsAccepted: false,
  signature: "",
  signatureDate: new Date().toISOString().split("T")[0],
};

// ── Hosting packages catalog ───────────────────────────────────────────────
export const HOSTING_PACKAGES = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "R 149/mo",
    features: ["1 GB Storage", "5 Email Accounts", "Free SSL", "1 Domain"],
  },
  {
    id: "business" as const,
    name: "Business",
    price: "R 299/mo",
    features: ["10 GB Storage", "25 Email Accounts", "Free SSL", "3 Domains"],
  },
  {
    id: "professional" as const,
    name: "Professional",
    price: "R 549/mo",
    features: [
      "50 GB Storage",
      "Unlimited Email",
      "Free SSL",
      "Unlimited Domains",
    ],
  },
] as const;
