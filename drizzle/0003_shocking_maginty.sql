CREATE TABLE "reseller_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"margin_pct" integer NOT NULL,
	"margin_min_cents" integer NOT NULL,
	"price_rounding" text DEFAULT 'whole' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
