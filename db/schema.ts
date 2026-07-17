import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id").notNull(),
  // "monthly" | "annual"
  cycle: text("cycle").notNull(),
  // "active" | "past_due" | "canceled" | "incomplete"
  status: text("status").notNull().default("active"),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Dedup table so a replayed/retried Stripe webhook is processed at most once.
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(), // Stripe event id
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rentals = pgTable("rentals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerEmail: text("customer_email").notNull(),      // provisioned email (may differ from account)

  // Rental subject (denormalized snapshot — inventory is volatile, dashboard must still render)
  phoneId: text("phone_id").notNull(),                  // CellGods phone_id (uuid → text)
  model: text("model").notNull(),
  platform: text("platform").notNull(),                 // "android" | "iphone" (CellGods field is `type`)

  // Commercial terms (integer cents)
  billingPeriod: text("billing_period").notNull(),      // daily | weekly | monthly
  durationDays: integer("duration_days").notNull(),
  wholesaleQuotedCents: integer("wholesale_quoted_cents").notNull(), // snapshot at checkout
  retailCents: integer("retail_cents").notNull(),                    // Stripe amount charged
  chargedCents: integer("charged_cents"),               // actual wholesale from activate.charged_cents

  // State machine (see §5.4)
  status: text("status").notNull().default("pending_payment"),
  activationAttempts: integer("activation_attempts").notNull().default(0),
  lastError: text("last_error"),

  // Payment linkage / idempotency (AMERICELL Stripe)
  stripeSessionId: text("stripe_session_id").notNull().unique(),     // idempotency key
  stripePaymentIntentId: text("stripe_payment_intent_id"),

  // CellGods activation (NULL until /activate succeeds)
  cellgodsOrderId: text("cellgods_order_id").unique(), // idempotency backstop
  streamUrl: text("stream_url"),                       // 4h token URL; re-minted by PIN on CellGods
  pinCiphertext: text("pin_ciphertext"),               // AES-256-GCM (iv:tag:ct), never plaintext
  streamMintedAt: timestamp("stream_minted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),        // ORDER/rental expiry
  activatedAt: timestamp("activated_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("rentals_user_id_idx").on(t.userId),
  index("rentals_status_idx").on(t.status),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type Rental = typeof rentals.$inferSelect;
export type NewRental = typeof rentals.$inferInsert;

// Append-only audit / activity log — every meaningful admin, customer, and
// system event is written here (see lib/logs.ts) and surfaced in /admin/logs.
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorType: text("actor_type").notNull(), // "admin" | "customer" | "system"
    actorEmail: text("actor_email"),
    actorId: uuid("actor_id"),
    action: text("action").notNull(), // e.g. "admin.topup", "rental.activated"
    targetType: text("target_type"), // "rental" | "order" | "phone" | ...
    targetId: text("target_id"),
    metadata: jsonb("metadata"), // arbitrary structured details
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("activity_logs_created_idx").on(t.createdAt),
    index("activity_logs_action_idx").on(t.action),
    index("activity_logs_actor_idx").on(t.actorEmail),
  ],
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

/**
 * Reseller pricing settings — a single-row ("singleton") config so the owner can
 * tune the resale margin from the admin panel at runtime (no redeploy). Read by
 * BOTH the browse catalog AND checkout via `getMarginOpts()`, so the price a
 * customer sees always equals the price they're charged. Falls back to the
 * RESELLER_* env vars when the row is absent.
 */
export const resellerSettings = pgTable("reseller_settings", {
  id: text("id").primaryKey(), // always "singleton"
  marginPct: integer("margin_pct").notNull(),
  marginMinCents: integer("margin_min_cents").notNull(),
  priceRounding: text("price_rounding").notNull().default("whole"),
  // Pricing mode: "flat" = fixed price per platform (below); "margin" = the
  // wholesale+margin model above. Defaults to flat (€150 Android / €250 iPhone).
  pricingMode: text("pricing_mode").notNull().default("flat"),
  flatCurrency: text("flat_currency").notNull().default("eur"),
  flatAndroidMonthlyCents: integer("flat_android_monthly_cents")
    .notNull()
    .default(15000),
  flatIphoneMonthlyCents: integer("flat_iphone_monthly_cents")
    .notNull()
    .default(25000),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedBy: text("updated_by"),
});

export type ResellerSettings = typeof resellerSettings.$inferSelect;

/**
 * Per-device markup override. When a row exists for a `phone_id`, that device
 * uses `margin_pct` instead of the global `reseller_settings` markup — for both
 * browse and checkout (same `resolveMarginOpts` path), so shown = charged. The
 * global minimum + rounding still apply. No row → the device uses the global markup.
 */
export const devicePriceOverrides = pgTable("device_price_overrides", {
  phoneId: text("phone_id").primaryKey(), // CellGods phone_id
  marginPct: integer("margin_pct").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedBy: text("updated_by"),
});

export type DevicePriceOverride = typeof devicePriceOverrides.$inferSelect;

/**
 * Marketing leads captured by the homepage popup (email + desired fleet size).
 * Deduped by email (upsert). Surfaced in the admin panel as the "Leads" list.
 */
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  fleetSize: text("fleet_size"), // e.g. "2-5", "26-100"
  source: text("source").notNull().default("homepage_popup"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Lead = typeof leads.$inferSelect;
