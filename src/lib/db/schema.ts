import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  smallint,
  date,
  unique,
} from "drizzle-orm/pg-core";

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
  // Phase 6 — convert-to-client back-link (CLIENT-02)
  convertedClientId: integer("converted_client_id").references(() => clients.id, { onDelete: "set null" }),
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
  // Phase 5 — stale-enquiry reminder automation (AUTOMATE-01)
  lastRemindedAt: date("last_reminded_at"),
  // Phase 6 — convert-to-client back-link (CLIENT-02)
  convertedClientId: integer("converted_client_id").references(() => clients.id, { onDelete: "set null" }),
});

export const crmNotes = pgTable("crm_notes", {
  id: serial("id").primaryKey(),
  recordType: varchar("record_type", { length: 20 }).notNull(), // "registration" | "enquiry" | "client"
  recordId: integer("record_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const hostingPackages = pgTable("hosting_packages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  priceRands: integer("price_rands").notNull(),
  pricePeriod: varchar("price_period", { length: 8 }).notNull().default("mo"),
  description: text("description").notNull().default(""),
  features: text("features").notNull().default(""), // newline-separated
  isPopular: boolean("is_popular").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const domainPrices = pgTable("domain_prices", {
  tld: varchar("tld", { length: 16 }).primaryKey(),
  priceRands: integer("price_rands"), // nullable — NULL = no price shown
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const billingSchedules = pgTable("billing_schedules", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 128 }).notNull(),
  clientEmail: varchar("client_email", { length: 256 }),
  packageId: integer("package_id").references(() => hostingPackages.id, { onDelete: "set null" }),
  billingStart: date("billing_start").notNull(),
  cycle: varchar("cycle", { length: 8 }).notNull().default("monthly"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  // Phase 8 — optional link to a stored client (INVOICE-09/10); nullable,
  // additive-only migration so pre-existing free-text invoices stay valid.
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  // Client info (free-text, no CRM FK — D-03)
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 320 }),
  billingAddress: text("billing_address"),
  // Calendar dates (Postgres DATE — no timezone ambiguity)
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  // Status: 'draft' | 'sent' | 'paid' — overdue is computed at read time (D-06)
  status: varchar("status", { length: 8 }).notNull().default("draft"),
  // Numbering (NULL while draft — assigned at draft→sent, D-04)
  fiscalYear: integer("fiscal_year"),
  sequenceNumber: integer("sequence_number"),
  // Money: INTEGER rands, not cents (Phase 3 convention)
  totalRands: integer("total_rands").notNull().default(0),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  // Phase 5 — recurring billing automation (AUTOMATE-03) and overdue reminders (AUTOMATE-02)
  billingScheduleId: integer("billing_schedule_id").references(() => billingSchedules.id, { onDelete: "set null" }),
  billingPeriodStart: date("billing_period_start"),
  lastRemindedAt: date("last_reminded_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (t) => [
  unique("invoices_recurring_unique").on(t.billingScheduleId, t.billingPeriodStart),
]);

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: smallint("quantity").notNull().default(1),
  unitPriceRands: integer("unit_price_rands").notNull(),
  lineTotalRands: integer("line_total_rands").notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
});

export const automationRuns = pgTable("automation_runs", {
  id: serial("id").primaryKey(),
  jobName: varchar("job_name", { length: 32 }).notNull(),
  ranAt: timestamp("ran_at", { withTimezone: true }).notNull(),
  triggeredBy: varchar("triggered_by", { length: 16 }).notNull(),
  status: varchar("status", { length: 8 }).notNull(),
  resultSummary: text("result_summary"),
  errorMessage: text("error_message"),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull().default(""),
  company: varchar("company", { length: 200 }).notNull().default(""),
  physicalAddress: text("physical_address").notNull().default(""),
  postalAddress: text("postal_address").notNull().default(""),
  // provenance — "manual" | "from_registration" | "from_enquiry" (CLIENT-02)
  source: varchar("source", { length: 20 }).notNull().default("manual"),
  // nullable back-link to the lead this client came from (no FK — pairs like crmNotes)
  sourceRecordType: varchar("source_record_type", { length: 20 }), // "registration" | "enquiry" | null
  sourceRecordId: integer("source_record_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  // Optional link to a stored client (mirrors invoices.clientId, QUOTE-01)
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 320 }),
  billingAddress: text("billing_address"),
  issueDate: date("issue_date").notNull(),
  validUntil: date("valid_until").notNull(),
  // 'draft' | 'sent' | 'accepted' | 'declined' — varchar(10), NOT 8 ("accepted"/"declined" are 8 chars, need headroom)
  status: varchar("status", { length: 10 }).notNull().default("draft"),
  totalRands: integer("total_rands").notNull().default(0),
  // QUOTE-05 idempotency anchor — set once on first convert; NULL = not yet converted
  convertedInvoiceId: integer("converted_invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const quotationLineItems = pgTable("quotation_line_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id")
    .notNull()
    .references(() => quotations.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: smallint("quantity").notNull().default(1),
  unitPriceRands: integer("unit_price_rands").notNull(),
  lineTotalRands: integer("line_total_rands").notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
});
