CREATE TABLE "invoice_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" smallint DEFAULT 1 NOT NULL,
	"unit_price_rands" integer NOT NULL,
	"line_total_rands" integer NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"client_email" varchar(320),
	"billing_address" text,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"status" varchar(8) DEFAULT 'draft' NOT NULL,
	"fiscal_year" integer,
	"sequence_number" integer,
	"total_rands" integer DEFAULT 0 NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;