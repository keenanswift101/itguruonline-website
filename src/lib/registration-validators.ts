/**
 * South African ID number validation (Luhn algorithm + date check)
 * SA ID format: YYMMDD SSSS C A Z
 *   YYMMDD = date of birth
 *   SSSS   = sequence number (0000–4999 = female, 5000–9999 = male)
 *   C      = citizenship (0 = SA citizen, 1 = permanent resident)
 *   A      = usually 8 (race classification — legacy, ignored)
 *   Z      = Luhn check digit
 */
export function validateSAID(id: string): { valid: boolean; error?: string } {
  const clean = id.replace(/\s/g, "");

  if (!/^\d{13}$/.test(clean)) {
    return { valid: false, error: "SA ID number must be exactly 13 digits." };
  }

  // Validate date of birth embedded in first 6 digits
  const year = parseInt(clean.slice(0, 2), 10);
  const month = parseInt(clean.slice(2, 4), 10);
  const day = parseInt(clean.slice(4, 6), 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, error: "ID number contains an invalid date of birth." };
  }

  // Luhn check
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(clean[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: "ID number checksum is invalid." };
  }

  return { valid: true };
}

/**
 * Phone number validation.
 * South African numbers (+27 / 27 / 0-prefixed) get the strict SA format check.
 * Numbers entered with any other country code get a general international
 * format check (a leading "+" followed by 7–15 digits — E.164-style).
 */
export function validateSAPhone(phone: string): { valid: boolean; error?: string } {
  const clean = phone.replace(/[\s\-().]/g, "");
  if (!clean) return { valid: true }; // optional fields allowed empty

  const isSA = /^(\+27|27|0)/.test(clean);

  if (isSA) {
    const saPhoneRe = /^(\+27|27|0)[1-9]\d{8}$/;
    if (!saPhoneRe.test(clean)) {
      return {
        valid: false,
        error: "Enter a valid South African number (e.g. 072 962 7608 or +27 72 962 7608).",
      };
    }
    return { valid: true };
  }

  const intlPhoneRe = /^\+[1-9]\d{6,14}$/;
  if (!intlPhoneRe.test(clean)) {
    return {
      valid: false,
      error: "Enter a valid phone number including country code (e.g. +44 7911 123456).",
    };
  }
  return { valid: true };
}

/**
 * Validate step A fields — returns field-level errors
 */
export function validateStepA(data: {
  firstName: string;
  surname: string;
  physicalAddress: string;
  cellPhone: string;
  email: string;
  telephone?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.firstName.trim()) errors.firstName = "First name is required.";
  if (!data.surname.trim()) errors.surname = "Surname is required.";

  if (!data.physicalAddress.trim())
    errors.physicalAddress = "Physical address is required.";

  if (!data.cellPhone.trim()) {
    errors.cellPhone = "Cell phone number is required.";
  } else {
    const result = validateSAPhone(data.cellPhone);
    if (!result.valid) errors.cellPhone = result.error!;
  }

  if (data.telephone) {
    const result = validateSAPhone(data.telephone);
    if (!result.valid) errors.telephone = result.error!;
  }

  if (!data.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

/**
 * Validate step B fields
 */
export function validateStepB(data: { domainName: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.domainName.trim()) errors.domainName = "Domain name is required.";
  else if (!/^[a-z0-9]([a-z0-9.-]{0,61}[a-z0-9])?$/i.test(data.domainName.trim())) {
    errors.domainName = "Enter a valid domain name (e.g. mycompany.co.za).";
  }
  return errors;
}

const VALID_HOSTING_PACKAGE_IDS = ["startup", "basic", "standard", "advanced", "enterprise", "parked"];

/**
 * Validate step C fields
 */
export function validateStepC(data: { hostingPackage: string; additionalServices?: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.hostingPackage) {
    errors.hostingPackage = "Please select a hosting package.";
  } else if (!VALID_HOSTING_PACKAGE_IDS.includes(data.hostingPackage)) {
    errors.hostingPackage = "Invalid hosting package selected.";
  }
  if (data.additionalServices && data.additionalServices.length > 2000) {
    errors.additionalServices = "Additional notes must be under 2000 characters.";
  }
  return errors;
}

/**
 * Validate step D fields
 */
export function validateStepD(data: {
  termsAccepted: boolean;
  signature: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.termsAccepted) errors.termsAccepted = "You must accept the terms and conditions.";
  if (!data.signature.trim()) errors.signature = "Please type your full name as your digital signature.";
  return errors;
}
