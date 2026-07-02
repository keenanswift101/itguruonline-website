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
export type HostingPackage = string; // DB slug is now the authority

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

