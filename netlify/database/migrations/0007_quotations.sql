CREATE TABLE "quotation_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" smallint DEFAULT 1 NOT NULL,
	"unit_price_rands" integer NOT NULL,
	"line_total_rands" integer NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"client_name" varchar(255) NOT NULL,
	"client_email" varchar(320),
	"billing_address" text,
	"issue_date" date NOT NULL,
	"valid_until" date NOT NULL,
	"status" varchar(10) DEFAULT 'draft' NOT NULL,
	"total_rands" integer DEFAULT 0 NOT NULL,
	"converted_invoice_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotation_line_items" ADD CONSTRAINT "quotation_line_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_converted_invoice_id_invoices_id_fk" FOREIGN KEY ("converted_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;