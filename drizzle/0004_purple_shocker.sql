CREATE TABLE "device_price_overrides" (
	"phone_id" text PRIMARY KEY NOT NULL,
	"margin_pct" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
