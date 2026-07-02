CREATE TABLE "domain_prices" (
	"tld" varchar(16) PRIMARY KEY NOT NULL,
	"price_rands" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosting_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(32) NOT NULL,
	"name" varchar(64) NOT NULL,
	"price_rands" integer NOT NULL,
	"price_period" varchar(8) DEFAULT 'mo' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"features" text DEFAULT '' NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hosting_packages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "hosting_packages" ("slug", "name", "price_rands", "price_period", "description", "features", "is_popular", "sort_order") VALUES
  ('startup', 'Startup', 85, 'mo', 'Perfect for personal sites and small businesses just getting started online.', E'1 GB SSD Storage\n1 Website\nFree SSL\n2 Databases\nUnlimited Mailboxes\n50 Emails/hour\nUnlimited Traffic\nFree Migration', false, 1),
  ('basic', 'Basic', 99, 'mo', 'Our most popular plan — ideal for growing small businesses.', E'5 GB SSD Storage\n3 Websites\nFree SSL\n3 Subdomains\n6 Databases\nUnlimited Mailboxes\n100 Emails/hour\nUnlimited Traffic\nFree Migration', true, 2),
  ('standard', 'Standard', 149, 'mo', 'More room to grow, with extra websites and resources.', E'10 GB SSD Storage\n5 Websites\nFree SSL\n5 Subdomains\n10 Databases\nUnlimited Mailboxes\n200 Emails/hour\nUnlimited Traffic\nFree Migration', false, 3),
  ('advanced', 'Advanced', 279, 'mo', 'For established businesses running multiple sites.', E'20 GB SSD Storage\n10 Websites\nFree SSL\n10 Subdomains\n20 Databases\nUnlimited Mailboxes\n500 Emails/hour\nUnlimited Traffic\nFree Migration', false, 4),
  ('enterprise', 'Enterprise', 399, 'mo', 'Maximum resources for agencies and high-traffic businesses.', E'30 GB SSD Storage\n20 Websites\nFree SSL\n20 Subdomains\n40 Databases\nUnlimited Mailboxes\n1000 Emails/hour\nUnlimited Traffic\nFree Migration', false, 5),
  ('parked', 'Parked Domain', 35, 'mo', 'Reserve your domain online while you plan your website — upgrade anytime.', E'Holds your domain online\nNo website hosting included\nUpgrade anytime', false, 6)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "domain_prices" ("tld") VALUES
  ('.co.za'), ('.com'), ('.net'), ('.org'), ('.online'), ('.africa')
ON CONFLICT ("tld") DO NOTHING;
--> statement-breakpoint
INSERT INTO "site_settings" ("key", "value") VALUES
  ('contact_email', 'info@it-guru.co.za'),
  ('hosting_setup_fee_note', 'New hosting accounts include a once-off R395 cPanel account setup, configuration, and migration-assistance fee.')
ON CONFLICT ("key") DO NOTHING;
