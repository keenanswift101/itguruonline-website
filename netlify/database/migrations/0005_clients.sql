CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(30) DEFAULT '' NOT NULL,
	"company" varchar(200) DEFAULT '' NOT NULL,
	"physical_address" text DEFAULT '' NOT NULL,
	"postal_address" text DEFAULT '' NOT NULL,
	"source" varchar(20) DEFAULT 'manual' NOT NULL,
	"source_record_type" varchar(20),
	"source_record_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_registrations" ADD COLUMN "converted_client_id" integer;--> statement-breakpoint
ALTER TABLE "contact_enquiries" ADD COLUMN "converted_client_id" integer;--> statement-breakpoint
ALTER TABLE "client_registrations" ADD CONSTRAINT "client_registrations_converted_client_id_clients_id_fk" FOREIGN KEY ("converted_client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_enquiries" ADD CONSTRAINT "contact_enquiries_converted_client_id_clients_id_fk" FOREIGN KEY ("converted_client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;