CREATE TABLE "rentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"customer_email" text NOT NULL,
	"phone_id" text NOT NULL,
	"model" text NOT NULL,
	"platform" text NOT NULL,
	"billing_period" text NOT NULL,
	"duration_days" integer NOT NULL,
	"wholesale_quoted_cents" integer NOT NULL,
	"retail_cents" integer NOT NULL,
	"charged_cents" integer,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"activation_attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"stripe_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"cellgods_order_id" text,
	"stream_url" text,
	"pin_ciphertext" text,
	"stream_minted_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rentals_stripe_session_id_unique" UNIQUE("stripe_session_id"),
	CONSTRAINT "rentals_cellgods_order_id_unique" UNIQUE("cellgods_order_id")
);
--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rentals_user_id_idx" ON "rentals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rentals_status_idx" ON "rentals" USING btree ("status");