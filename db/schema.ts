import {
  index,
  integer,
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
