/**
 * Registration form types and client-side validation
 * Mirrors server-side validation in /api/register/route.ts
 */

// ── Section A ──────────────────────────────────────────────────────────────
export interface StepAData {
  firstName: string;
  surname: string;
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
export type HostingPackage = "startup" | "basic" | "standard" | "advanced" | "enterprise" | "parked" | "";

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
// One-off account creation / cPanel setup & configuration fee, applied to
// every new hosting signup except Parked Domain.
export const HOSTING_SETUP_FEE = "R395.00 once-off";

export const HOSTING_PACKAGES = [
  {
    id: "startup" as const,
    name: "Startup",
    price: "R85/mo",
    features: [
      "1 GB SSD Storage",
      "1 Website",
      "Free SSL",
      "2 Databases",
      "Unlimited Mailboxes",
      "50 Emails/hour",
      "Unlimited Traffic",
      "Free Migration",
    ],
  },
  {
    id: "basic" as const,
    name: "Basic",
    price: "R99/mo",
    features: [
      "5 GB SSD Storage",
      "3 Websites",
      "Free SSL",
      "3 Subdomains",
      "6 Databases",
      "Unlimited Mailboxes",
      "100 Emails/hour",
      "Unlimited Traffic",
      "Free Migration",
    ],
  },
  {
    id: "standard" as const,
    name: "Standard",
    price: "R149/mo",
    features: [
      "10 GB SSD Storage",
      "5 Websites",
      "Free SSL",
      "5 Subdomains",
      "10 Databases",
      "Unlimited Mailboxes",
      "200 Emails/hour",
      "Unlimited Traffic",
      "Free Migration",
    ],
  },
  {
    id: "advanced" as const,
    name: "Advanced",
    price: "R279/mo",
    features: [
      "20 GB SSD Storage",
      "10 Websites",
      "Free SSL",
      "10 Subdomains",
      "20 Databases",
      "Unlimited Mailboxes",
      "500 Emails/hour",
      "Unlimited Traffic",
      "Free Migration",
    ],
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    price: "R399/mo",
    features: [
      "30 GB SSD Storage",
      "20 Websites",
      "Free SSL",
      "20 Subdomains",
      "40 Databases",
      "Unlimited Mailboxes",
      "1000 Emails/hour",
      "Unlimited Traffic",
      "Free Migration",
    ],
  },
  {
    id: "parked" as const,
    name: "Parked Domain",
    price: "R35/mo",
    features: ["Holds your domain online", "No website hosting included", "Upgrade anytime"],
  },
] as const;
