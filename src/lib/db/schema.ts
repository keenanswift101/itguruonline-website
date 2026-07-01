import { pgTable, serial, varchar, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  // groundwork for deferred AUTH-05 multi-staff — unused in v2.0 single-admin build
  role: varchar("role", { length: 32 }).notNull().default("admin"),
});

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  ipAddress: varchar("ip_address", { length: 64 }),
  succeeded: boolean("succeeded").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clientRegistrations = pgTable("client_registrations", {
  id: serial("id").primaryKey(),
  referenceId: varchar("reference_id", { length: 32 }).notNull().unique(),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  // Step A — personal info
  firstName: varchar("first_name", { length: 100 }).notNull(),
  surname: varchar("surname", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  cellPhone: varchar("cell_phone", { length: 30 }).notNull(),
  telephone: varchar("telephone", { length: 30 }).notNull().default(""),
  physicalAddress: text("physical_address").notNull(),
  postalAddress: text("postal_address").notNull().default(""),
  // Step B — domain
  domainName: varchar("domain_name", { length: 253 }).notNull(),
  nameserver1: varchar("nameserver1", { length: 253 }).notNull().default(""),
  nameserver2: varchar("nameserver2", { length: 253 }).notNull().default(""),
  // Step C — package & add-ons
  hostingPackage: varchar("hosting_package", { length: 32 }).notNull(),
  domainRegistration: boolean("domain_registration").notNull().default(false),
  sslCertificate: boolean("ssl_certificate").notNull().default(false),
  emailHosting: boolean("email_hosting").notNull().default(false),
  websiteDesign: boolean("website_design").notNull().default(false),
  additionalServices: text("additional_services").notNull().default(""),
  // Step D — declaration
  termsAccepted: boolean("terms_accepted").notNull(),
  signature: varchar("signature", { length: 200 }).notNull(),
  signatureDate: varchar("signature_date", { length: 10 }).notNull(),
  // Metadata
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactEnquiries = pgTable("contact_enquiries", {
  id: serial("id").primaryKey(),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const crmNotes = pgTable("crm_notes", {
  id: serial("id").primaryKey(),
  recordType: varchar("record_type", { length: 20 }).notNull(), // "registration" | "enquiry"
  recordId: integer("record_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
