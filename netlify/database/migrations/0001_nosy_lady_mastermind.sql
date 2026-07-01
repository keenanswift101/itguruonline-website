CREATE TABLE "client_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_id" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'new' NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"surname" varchar(100) NOT NULL,
	"email" varchar(320) NOT NULL,
	"cell_phone" varchar(30) NOT NULL,
	"telephone" varchar(30) DEFAULT '' NOT NULL,
	"physical_address" text NOT NULL,
	"postal_address" text DEFAULT '' NOT NULL,
	"domain_name" varchar(253) NOT NULL,
	"nameserver1" varchar(253) DEFAULT '' NOT NULL,
	"nameserver2" varchar(253) DEFAULT '' NOT NULL,
	"hosting_package" varchar(32) NOT NULL,
	"domain_registration" boolean DEFAULT false NOT NULL,
	"ssl_certificate" boolean DEFAULT false NOT NULL,
	"email_hosting" boolean DEFAULT false NOT NULL,
	"website_design" boolean DEFAULT false NOT NULL,
	"additional_services" text DEFAULT '' NOT NULL,
	"terms_accepted" boolean NOT NULL,
	"signature" varchar(200) NOT NULL,
	"signature_date" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_registrations_reference_id_unique" UNIQUE("reference_id")
);
--> statement-breakpoint
CREATE TABLE "contact_enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(32) DEFAULT 'new' NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(30),
	"subject" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_type" varchar(20) NOT NULL,
	"record_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
