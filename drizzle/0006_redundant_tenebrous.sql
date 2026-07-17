ALTER TABLE "reseller_settings" ADD COLUMN "pricing_mode" text DEFAULT 'flat' NOT NULL;--> statement-breakpoint
ALTER TABLE "reseller_settings" ADD COLUMN "flat_currency" text DEFAULT 'eur' NOT NULL;--> statement-breakpoint
ALTER TABLE "reseller_settings" ADD COLUMN "flat_android_monthly_cents" integer DEFAULT 15000 NOT NULL;--> statement-breakpoint
ALTER TABLE "reseller_settings" ADD COLUMN "flat_iphone_monthly_cents" integer DEFAULT 25000 NOT NULL;