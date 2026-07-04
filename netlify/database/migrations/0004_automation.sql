CREATE TABLE "automation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_name" varchar(32) NOT NULL,
	"ran_at" timestamp with time zone NOT NULL,
	"triggered_by" varchar(16) NOT NULL,
	"status" varchar(8) NOT NULL,
	"result_summary" text,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "billing_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" varchar(128) NOT NULL,
	"client_email" varchar(256),
	"package_id" integer,
	"billing_start" date NOT NULL,
	"cycle" varchar(8) DEFAULT 'monthly' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_enquiries" ADD COLUMN "last_reminded_at" date;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "billing_schedule_id" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "billing_period_start" date;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "last_reminded_at" date;--> statement-breakpoint
ALTER TABLE "billing_schedules" ADD CONSTRAINT "billing_schedules_package_id_hosting_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."hosting_packages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billing_schedule_id_billing_schedules_id_fk" FOREIGN KEY ("billing_schedule_id") REFERENCES "public"."billing_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_recurring_unique" UNIQUE("billing_schedule_id","billing_period_start");
--> statement-breakpoint
INSERT INTO "site_settings" ("key", "value") VALUES
  ('enquiry_stale_days', '7'),
  ('invoice_overdue_reminder_days', '1')
ON CONFLICT ("key") DO NOTHING;