# AMERICELL — CellGods Reseller Implementation Spec

One consolidated, deduplicated, build-ordered plan for turning AMERICELL into a CellGods
reseller SaaS: a **customer app** (browse live phones → pay retail once → get PIN + stream URL)
and an **owner-only admin panel** (credit, inventory, orders, ledger, top-up).

This spec is **grounded in the current code** (Next.js 16.2.9 App Router, Auth.js v5 JWT, Neon
HTTP + Drizzle 0.45, Stripe 22, base-nova/base-ui shadcn). Where the five source designs
disagreed, the conflict and its resolution are called out inline as **[RESOLVED]**.

> Per `AGENTS.md`: this is a modified Next.js. Read `node_modules/next/dist/docs/` for the
> relevant App Router / data-security guide before writing each piece. Route handler `params`
> are Promises (already true in this repo); route handlers are uncached by default.

---

## 1. Overview & architecture

### 1.1 The model shift
The current code sells a **recurring Stripe subscription of a hard-coded device**
(`subscriptions` table, `mode:"subscription"`, static `lib/devices.ts`, stub `lib/provider.ts`).
CellGods does not sell that shape. CellGods sells a **fixed-duration wholesale rental** deducted
from a **prepaid reseller credit balance**, which mints a **PIN + 4h stream URL**.

AMERICELL therefore becomes a **one-time retail purchase of a time-boxed rental**:

| Old | New |
|---|---|
| recurring `mode:"subscription"` | one-time **`mode:"payment"`** at retail |
| `cycle: monthly \| annual` | rental **duration** `daily \| weekly \| monthly` → `duration_days` 1 / 7 / 30 |
| `subscriptions` table | new **`rentals`** table (`cellgods_order_id`, `pin`, `stream_url`, `expires_at`) |
| static `lib/devices.ts` | live **`lib/pricing.ts`** over `getInventory()` + retail margin |
| stub `lib/provider.ts` | real **`lib/cellgods.ts`** (already exists) |
| unlock = "mint session" | **read stored `stream_url` + PIN** (CellGods re-mints via PIN after 4h) |

`users` and `webhook_events` are kept as-is. `subscriptions` is **kept in schema but deprecated**
(no longer written); drop it in a later migration once reads are gone. **[RESOLVED: table name —
`rentals`** wins over `orders`/`device_orders`; matches 2 of 5 designs and is unambiguous.]

### 1.2 Two independent Stripe surfaces — never conflate
1. **AMERICELL Stripe** (`lib/stripe.ts`, existing): customer **retail** one-time payment.
2. **CellGods hosted Stripe Checkout** (`POST /topup` → `checkout_url`): funds the **reseller
   credit** balance. Refunds happen **only** on surface #1; never via CellGods `/deactivate`.

### 1.3 Activation timing — **[RESOLVED]**
**Activation happens at webhook time, after payment is captured** — never at unlock/browse time.
(Overrides the api-client "activate on unlock" design.) The customer's access route only *reads*
the stored `stream_url`/PIN; it never calls `activate` (that would re-spend credit and mint a
duplicate order).

### 1.4 Data-flow at a glance
```
Browse  : app/page.tsx → PricingSection (server) → getRetailCatalog() → getInventory() → strip wholesale → PricingGrid (client)
Buy     : POST /api/checkout → auth + live inventory + availability + credit preflight → createPendingRental → Stripe mode:"payment"
Fulfil  : POST /api/webhook checkout.session.completed → markPaid → beginActivation(CAS) → cellgods.activate → finalize (encrypt PIN)
Use     : dashboard → GET /api/rentals/[id]/access (streamUrl+expiry) + /pin (decrypt) → open CellGods stream page
Admin   : /admin/* (server reads via lib/cellgods) + POST /api/admin/* proxies for mutations
```

---

## 2. Environment variables

Reconciled canonical set. **[RESOLVED: margin]** — the existing `.env.example` has
`NEXT_PUBLIC_RESELLER_MARGIN_PCT`; **replace it with a server-only `RESELLER_MARGIN_PCT`.** A
public margin % lets the client back-compute wholesale from displayed retail, leaking cost. Retail
is computed **server-side**; only retail cents cross to the client. **[RESOLVED: markup form]** —
use **percent** (`RESELLER_MARGIN_PCT`), not a multiplier, and one shared value for both customer
checkout and the admin margin estimate (drop `ADMIN_RETAIL_MARKUP`, `CELLGODS_RETAIL_MARKUP`).

```bash
# ── Auth / DB / retail Stripe (EXISTING — keep) ──
AUTH_SECRET=...                 # AUTH_URL optional
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
CHECKOUT_SUCCESS_URL=http://localhost:3000/dashboard?checkout=success
CHECKOUT_CANCEL_URL=http://localhost:3000/#pricing
# NEXT_PUBLIC_SITE_URL=...      # the ONLY NEXT_PUBLIC_* secret-adjacent var

# ── CellGods reseller API (EXISTING keys — keep) ──
CELLGODS_API_KEY=cg_reseller_xxx        # SECRET, server-only, read ONLY in lib/cellgods.ts
CELLGODS_API_BASE=https://api.cellgods.com/api/reseller

# ── Admin gate (EXISTING — keep) ──
ADMIN_EMAILS=staskoskg@gmail.com        # comma-separated, case-insensitive

# ── Retail pricing (CHANGE: was NEXT_PUBLIC_RESELLER_MARGIN_PCT) ──
RESELLER_MARGIN_PCT=50                   # server-only percent markup over wholesale
RESELLER_MARGIN_MIN_CENTS=500            # absolute floor added if pct markup is tiny
# RESELLER_PRICE_ROUNDING=whole          # whole | psychological | none (default whole)

# ── Security / ops (NEW) ──
PIN_ENCRYPTION_KEY=<32-byte base64>      # SECRET, AES-256-GCM key for PIN-at-rest
CRON_SECRET=<random>                     # protects /api/cron/* (Phase 5)
# UPSTASH_REDIS_REST_URL= / UPSTASH_REDIS_REST_TOKEN=   # optional, prod rate-limit (Phase 5)
# RESELLER_LOW_CREDIT_ALERT_EMAIL=ops@americell.example # optional ops alert
```

**Retire:** `REMOTE_PROVIDER_URL`, `REMOTE_PROVIDER_API_KEY` (provider stub deleted), and the
`PRICE_*_MONTHLY/ANNUAL` per-device price ids (retail is now dynamic inline `price_data` in cents).

Rules: only `lib/cellgods.ts` reads `CELLGODS_API_KEY/BASE`; only `lib/admin.ts` reads
`ADMIN_EMAILS`; only `lib/crypto.ts` reads `PIN_ENCRYPTION_KEY`. Never add `NEXT_PUBLIC_` to any
secret. Fail closed: missing key ⇒ `isCellgodsConfigured=false` ⇒ callers return **503** (mirrors
`isStripeConfigured`/`isDbConfigured`).

---

## 3. `lib/cellgods.ts` — types & functions

**Status: already implemented in the repo and correct.** It starts with `import "server-only"`,
speaks the wire shapes verbatim (snake_case, integer cents, `{success,data}` envelope), sets
`X-API-Key`, uses `cache:"no-store"` + a 15s abort timeout, and **throws a typed error hierarchy**.

**[RESOLVED: error handling — throw, don't return a result union.]** Two designs proposed
discriminated `CgResult<T>`; three (plus the committed code) throw. Keep the **existing throwing
client** to avoid a rewrite; callers `try/catch` and branch on `err.status`.

Keep these exact exported names (already present):

```ts
export const isCellgodsConfigured: boolean;                 // Boolean(CELLGODS_API_KEY)

// Errors
export class CellgodsError extends Error { readonly status: number }   // status 0 = network/timeout
export class InsufficientCreditError extends CellgodsError { }         // HTTP 402
export class CellgodsNotConfiguredError extends CellgodsError { }      // key unset (status 0)

// Types (verified live shapes; docs' `platform`/`wholesale_monthly_cents` are WRONG)
export type Platform = "android" | "iphone";                // inventory field is `type`
export type BillingPeriod = "daily" | "weekly" | "monthly";
export type InventoryPhone = { phone_id; model; type: Platform; status;
  price_daily; price_weekly; price_monthly;                 // CENTS (may be null per tier)
  suggested_retail: { daily; weekly; monthly } | null;      // FIX: allow whole object null
  currency };
export type Balance = { credit_balance_cents; currency;
  auto_topup: { enabled; threshold_cents; amount_cents; payment_method_on_file? } };
export type ActivateInput  = { phone_id; customer_email; duration_days; billing_period? };
export type ActivateResult = { order_id; pin; stream_url; expires_at;   // expires_at = ORDER expiry
  charged_cents; billing_period; credit_balance_cents; currency };      // stream token is 4h, separate
export type Order       = { order_id; phone_id; customer_email; status; expires_at };
export type LedgerEntry = { delta_cents; balance_after_cents; reason; order_id?; created_at };
export type TopupInput  = { amount_cents; success_url?; cancel_url? };  // amount_cents >= 500
export type TopupResult = { checkout_url; session_id; amount_cents; currency };

// Endpoints (1:1 with CellGods; GETs are read-only, POSTs spend money / are non-idempotent)
export function getInventory(): Promise<InventoryPhone[]>;                       // GET  /inventory
export function getBalance(): Promise<Balance>;                                  // GET  /balance
export function activate(input: ActivateInput): Promise<ActivateResult>;        // POST /activate  (402 → InsufficientCreditError)
export function getOrders(): Promise<Order[]>;                                   // GET  /orders
export function deactivate(orderId: string): Promise<{order_id; status}>;       // POST /deactivate (NO refund)
export function getLedger(): Promise<LedgerEntry[]>;                             // GET  /ledger
export function topup(input: TopupInput): Promise<TopupResult>;                 // POST /topup
export function setAutoTopup(input: {enabled; threshold_cents; amount_cents}): Promise<AutoTopup>; // POST /auto_topup
```

Small polish only (not a rewrite): widen `suggested_retail` to `… | null`; on `POST /activate`
timeout/network do **not** auto-retry (see §7). The docs-only names `platform` /
`wholesale_monthly_cents` are deliberately not used.

---

## 4. DB schema changes & migration

Additive, non-destructive. Keep `users`, `subscriptions` (deprecated), `webhook_events`.

### 4.1 `db/schema.ts` — add `integer` to imports, append `rentals`
**[RESOLVED]** merged field set: `platform` (not `deviceType`); PIN stored **encrypted**
(`pinCiphertext`, not `pin` plaintext and **not** a hash — the customer must read it back);
snapshots **both** `wholesaleQuotedCents` and `retailCents` at sale time (never sell at a loss on
inventory price drift); `phone_id`/`cellgods_order_id` are **text** (external ids).

```ts
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

export type Rental = typeof rentals.$inferSelect;
export type NewRental = typeof rentals.$inferInsert;
```

CellGods → column map: `phone_id→phoneId`, inventory `type→platform`, `model→model`,
`order_id→cellgodsOrderId`, `pin→pinCiphertext (encrypted)`, `stream_url→streamUrl`,
`expires_at→expiresAt`, `charged_cents→chargedCents`, `billing_period→billingPeriod`; Stripe
`amount_total→retailCents`; margin = `retailCents − chargedCents`.

### 4.2 Migration
```bash
npm run db:generate     # → drizzle/0001_*.sql   (0000 already exists)
npm run db:migrate      # apply (prod);  npm run db:push for a dev DB
```
Emits `CREATE TABLE "rentals"` + FK to `users` (cascade) + the two indexes + `UNIQUE`
constraints on `stripe_session_id` and `cellgods_order_id`. No backfill; no data loss.

---

## 5. Customer flow, pricing & margin

### 5.1 Retail math — `lib/money.ts` (pure, client-safe) + `lib/pricing.ts` (server)
**[RESOLVED]** Keep the markup function **pure** (env passed in) so the client can `fmtMoney`
without importing server env; the server reads `RESELLER_MARGIN_PCT`/`MIN_CENTS`/`ROUNDING` and
passes them in. Retire `lib/devices.ts`.

```ts
// lib/money.ts  (no "server-only"; no env reads — pure)
export function fmtMoney(cents: number, currency = "usd"): string;   // Intl el-GR, "$80,00"
/** retail = max(ceil(w*(1+pct/100)), w+minCents, w), then rounded. NEVER below wholesale. */
export function retailCentsFor(wholesaleCents: number,
  opts: { pct: number; minCents: number; rounding?: "whole"|"psychological"|"none" }): number;

// lib/pricing.ts  (import "server-only")
export type BillingPeriod = "daily"|"weekly"|"monthly";
export const DURATIONS = [
  { period:"daily",  days:1,  labelEl:"Ημέρα" },
  { period:"weekly", days:7,  labelEl:"Εβδομάδα" },
  { period:"monthly",days:30, labelEl:"Μήνας" },
] as const;
export type PublicRetailPhone = {   // what crosses to the client — NO wholesale
  phoneId; model; platform:"android"|"iphone"; available:boolean; currency;
  retail: Record<BillingPeriod, number>;   // cents
};
export function wholesaleFor(item: InventoryPhone, p: BillingPeriod): number; // price_daily/weekly/monthly
export function toPublicRetailPhone(item: InventoryPhone): PublicRetailPhone; // applies retailCentsFor per tier, strips wholesale
export async function getRetailCatalog():                                     // getInventory → map → strip
  Promise<{ ok:true; phones:PublicRetailPhone[] } | { ok:false; reason:"unconfigured"|"error" }>;
```
`suggested_retail` is currently null on the live API, so retail is **computed**; when a tier's
`suggested_retail.<period>` is present, prefer it, else `retailCentsFor(wholesale, …)`. All prices
are **integer cents**; the old dollar model (`priceMonthly: 49`) is gone.

### 5.2 `lib/rentals.ts` — DB helpers (parallels `lib/subscriptions.ts`, all `isDbConfigured`-guarded)
Single-statement operations only — **Neon HTTP has no interactive transactions**, so the lock is a
compare-and-swap `UPDATE … RETURNING`.

```ts
createPendingRental(v): Promise<Rental>;                 // status "pending_payment", unique stripeSessionId
getRentalBySession(sid): Promise<Rental|undefined>;
getRentalById(id): Promise<Rental|undefined>;
getRentalForUser(id, userId): Promise<Rental|undefined>; // ownership check
listRentalsForUser(userId): Promise<Rental[]>;

markPaid(sid, paymentIntentId): Promise<Rental|undefined>;      // CAS: WHERE status='pending_payment' → 'paid'
beginActivation(sid): Promise<Rental|undefined>;               // CAS gate: WHERE status='paid' → 'activating', attempts++
finalizeActivation(sid, a): Promise<void>;                     // set 'active', cellgodsOrderId, streamUrl, pinCiphertext, streamMintedAt=now, expiresAt, chargedCents, activatedAt=now
markActivationPendingCredit(sid, err): Promise<void>;          // 402 path → 'activation_pending_credit'
markActivationFailedTransient(sid, err): Promise<void>;        // reset 'activating' → 'paid' for Stripe retry
markRefunded(sid): Promise<void>;
markDeactivated(sid): Promise<void>;
markExpired(id): Promise<void>;
```

### 5.3 `lib/crypto.ts` — PIN at rest (Node crypto, AES-256-GCM)
```ts
import "server-only";
export function encryptPin(plain: string): string;  // "iv:tag:ciphertext" base64, PIN_ENCRYPTION_KEY
export function decryptPin(blob: string): string;   // called ONLY in the ownership-checked /pin route
```

### 5.4 Status machine
`pending_payment → paid → activating → active`; branches `activating → activation_pending_credit`
(402) and `activating → refunded` (409/terminal); terminal `refunded | expired | deactivated`.
`pooled` (CellGods reserved-not-live) is treated as **active-equivalent** for entitlement.

### 5.5 Customer flow (Flows A–E)

**A. Browse (live inventory).** `app/page.tsx` renders **server** `PricingSection` →
`getRetailCatalog()`; `ok:false,"unconfigured"` shows the existing demo-mode notice,
`"error"` shows Greek retry copy. Passes `PublicRetailPhone[]` to **client** `PricingGrid`.

**B. Purchase.** `POST /api/checkout` body `{ phoneId, period }`:
1. `auth()` → 401. Guard `isStripeConfigured && isCellgodsConfigured && isDbConfigured` → 503 demo.
2. `getInventory()`; find `phone_id`. Missing → 400; `status !== "available"` → **409** "μόλις δεσμεύτηκε".
3. `durationDays` from `period`; `wholesale = wholesaleFor(item, period)`;
   `retailCents = retailCentsFor(wholesale, …)`. Invariant `retailCents >= wholesale`.
4. **Fulfilment preflight [RESOLVED]:** `getBalance()`; if `credit_balance_cents < wholesale` →
   **503** "Προσωρινά μη διαθέσιμο" + low-credit ops alert. (Primary money-safety guard: never
   charge a customer we can't fulfil. Webhook refund is the backstop, not the primary path.)
5. `createPendingRental({ userId, customerEmail: session.user.email, phoneId, model, platform:item.type,
   billingPeriod:period, durationDays, wholesaleQuotedCents:wholesale, retailCents })`.
6. Stripe `checkout.sessions.create({ mode:"payment", line_items:[{ quantity:1, price_data:{
   currency:"usd", product_data:{ name:\`Americell — ${model} (${labelEl})\` }, unit_amount:retailCents }}],
   client_reference_id:userId, customer_email, success_url, cancel_url,
   metadata:{ rentalId, userId, phoneId, period, durationDays:String(durationDays) },
   payment_intent_data:{ metadata:{ rentalId } } })`. No `recurring`, no `subscription_data`.
7. `attachSession(rentalId, checkout.id)`; return `{ url }`.

**C. Fulfil (webhook).** See §7 for the exactly-once activate-and-store.

**D. Dashboard.** `app/dashboard/page.tsx` (server) → `listRentalsForUser`. Lazy-expire any
`active && expiresAt<now`. Partition **Ενεργές** / **Ιστορικό**. Each active card: model +
platform badge, live expiry countdown, **PIN reveal/copy**, token-freshness hint
(`now − streamMintedAt < 4h` → "Ζωντανός σύνδεσμος" else "Βάλε το PIN"), open button, Renew
(re-POST checkout), Cancel. `refunded` card shows "Επιστροφή χρημάτων — δοκίμασε ξανά".

**E. Open control + 4h token.** **[RESOLVED: split routes]** — PIN is *not* handed out on every
stream poll:
- `GET /api/rentals/[id]/access` → `getRentalForUser`; 403 if not owner; 410 if not `active`/expired.
  Returns `{ streamUrl, expiresAt, tokenFresh, tokenExpiresAt }` (no PIN). `Cache-Control: no-store`.
- `GET /api/rentals/[id]/pin` → same ownership check → `decryptPin` → `{ pin }`. `no-store`.

Client opens `streamUrl` in a new tab; **never re-calls `activate`**. When `!tokenFresh` the UI
foregrounds the PIN — CellGods' stream page re-mints a fresh URL from the PIN (no reseller re-mint
endpoint exists). Two distinct clocks shown: `tokenExpiresAt` (4h session) vs `expiresAt` (rental).

### 5.6 Retail pricing / margin summary
Retail = wholesale + margin, computed server-side, snapshotted on the rental. Margin =
`retailCents − chargedCents`, surfaced only in admin. Guardrails: `retailCents >= wholesale`
always; at activation assert `retailCents >= chargedCents` (else alert + do not silently continue).

---

## 6. Admin panel

Owner-only cockpit at `/admin`, Greek, over the existing glass aesthetic. Every CellGods call is
server-side; the browser never sees `CELLGODS_API_KEY`.

### 6.1 Gate — `lib/admin.ts` (**[RESOLVED]** env allowlist, no DB column)
```ts
import "server-only"; import { auth } from "@/auth";
const ALLOW = (process.env.ADMIN_EMAILS ?? "").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
export function isAdminEmail(email?: string|null): boolean;      // ALLOW.includes(lower(email))
export async function requireAdminPage(): Promise<{email;id}>;   // pages: redirect("/login") | notFound()
export async function requireAdmin(): Promise<{ session; status:200|401|403 }>; // routes
```
Two layers: `app/admin/layout.tsx` gates pages (anon → `redirect("/login")`; logged-in
non-owner → `notFound()` **404** so the panel's existence isn't leaked). Every `/api/admin/*`
handler **re-checks** `requireAdmin()` (layouts don't run for route handlers) → 404/403.

### 6.2 Pages (`app/admin/*`, Server Components; reads go straight through `lib/cellgods`)
```
app/admin/layout.tsx      gate + glass chrome + AdminNav (AuroraText logo, "Owner" badge, sign-out)
app/admin/page.tsx        Overview: Promise.all([getBalance,getOrders,getInventory]) → 4 StatCards + recent orders
app/admin/inventory/page  shadcn Table over InventoryPhone[] + per-row "Ενεργοποίηση" (available only)
app/admin/orders/page     Table over Order[] (join phone_id→model) + deactivate + "Νέα ενεργοποίηση"
app/admin/billing/page    getBalance + getLedger → balance hero + Tabs {Ledger, Settings(topup, auto-topup)}
app/admin/loading.tsx     Skeleton;   app/admin/error.tsx  Greek error boundary
```
**Overview margin estimate:** join `order.phone_id → inventory.price_monthly` over active orders;
`retail = Σ (suggested_retail.monthly ?? retailCentsFor(price_monthly, …))`; `margin = retail −
wholesale`. Label tiles "εκτίμηση" (uses the **same** `retailCentsFor` as checkout). Upgradeable
later to sum real `rentals.retailCents`.

### 6.3 Proxy routes (`app/api/admin/*`) — mutations only through here
Each: `requireAdmin()` → Zod-validate body → `lib/cellgods` call → on `CellgodsError` return
`Response.json({ error }, { status: e.status })` (Greek map below).

| Route | Method | Body (Zod) | CellGods |
|---|---|---|---|
| `/api/admin/inventory` | GET | – | `getInventory` |
| `/api/admin/orders` | GET | – | `getOrders` |
| `/api/admin/orders/activate` | POST | `{ phone_id, customer_email:email, duration_days:int>0, billing_period:enum }` | `activate` |
| `/api/admin/orders/deactivate` | POST | `{ order_id }` | `deactivate` |
| `/api/admin/balance` | GET | – | `getBalance` |
| `/api/admin/ledger` | GET | – | `getLedger` |
| `/api/admin/topup` | POST | `{ amount_cents:int>=500 }` (+ inject success/cancel_url from origin) | `topup` → `{ checkout_url }` |
| `/api/admin/auto-topup` | POST | `{ enabled, threshold_cents:int>=0, amount_cents:int>=0 }` | `setAutoTopup` |

**Greek status map** (used by routes + pages): 400 "Μη έγκυρο αίτημα" · 401 "Λείπει το κλειδί API" ·
402 "Ανεπαρκές υπόλοιπο — πρόσθεσε πίστωση" · 403 "Μη έγκυρο κλειδί API" · 404 "Δεν βρέθηκε" ·
409 "Η συσκευή δεν είναι πλέον διαθέσιμη" · 429 "Πολλά αιτήματα" · 500 "Σφάλμα διακομιστή".

### 6.4 UI components
`lib/money.ts` `fmtMoney` for display. Reuse the dashboard glass recipe + `MagicCard`/`ShineBorder`/
`BorderBeam`/`Particles`/`AuroraText`/`Reveal`. Add shadcn primitives (base-nova/base-ui):
```bash
npx shadcn@latest add table dialog alert-dialog switch skeleton
```
New client components under `components/admin/`: `admin-nav`, `stat-card`, `inventory-table`,
`orders-table`, `ledger-table`, `activate-dialog` (shows `order_id`/PIN/`stream_url`/`charged_cents`/
new balance; "λήγει σε 4 ώρες"), `deactivate-button` (AlertDialog, no-refund warning), `topup-dialog`
(dollars → cents, min $5, `window.location = checkout_url`), `auto-topup-form` (Switch disabled
unless `payment_method_on_file`). After every mutation → `router.refresh()`. Wrap wide tables in
`glassCard` + `overflow-x-auto`. Read `?topup=success|cancel` for a sonner toast.

---

## 7. Security & money-safety rules

### 7.1 Secrets
- `CELLGODS_API_KEY` read **only** in `lib/cellgods.ts` (starts with `import "server-only"`).
  `PIN_ENCRYPTION_KEY` only in `lib/crypto.ts`; `ADMIN_EMAILS` only in `lib/admin.ts`. `import
  "server-only"` at the top of every privileged lib. Never `NEXT_PUBLIC_` a secret; never log full
  CellGods responses (they contain `pin`/`stream_url`); never echo the key in errors.
- Wholesale cents never cross to the client — only `PublicRetailPhone` (retail cents) does. Margin
  % is server-only.

### 7.2 Webhook idempotency — activate **exactly once** (three layers + reconcile)
Stripe delivers at-least-once; a double `activate` double-spends credit and mints two orders.
Because Neon HTTP has no interactive transactions, the gate is a single atomic conditional UPDATE:
1. **Event-level (exists):** `alreadyProcessed(event.id)` / `markEventProcessed` on `webhook_events`.
2. **Session-level:** `rentals.stripe_session_id UNIQUE` — N deliveries collapse to one row.
3. **State gate (the exactly-once claim):** `beginActivation(sid)` runs
   `UPDATE rentals SET status='activating', activation_attempts=activation_attempts+1
   WHERE stripe_session_id=$1 AND status='paid' RETURNING *`. Only the first delivery gets a row and
   calls `activate`; concurrent deliveries get `undefined` and return.
4. **Backstop:** `cellgods_order_id UNIQUE`; and if `rental.cellgodsOrderId` is already set, skip activate.
5. **Reconcile ambiguous failure:** if `activate` times out/network-errors after the claim, do **not**
   blind-retry — call `getOrders()` and match `customer_email + phone_id` to recover `order_id`
   (Phase 5 cron); only truly-absent → retry.

**Webhook handler** (`checkout.session.completed` + `checkout.session.async_payment_succeeded`),
keeping the existing raw-body signature verify + event dedup:
```
if s.payment_status !== "paid": return {received:true}
rentalId = s.metadata.rentalId
markPaid(s.id, s.payment_intent)                     // CAS pending_payment → paid
owned = beginActivation(s.id)                        // CAS paid → activating
if !owned: return {received:true}                    // duplicate/already done
try:
  a = cellgods.activate({ phone_id, customer_email, duration_days, billing_period })
  finalizeActivation(s.id, { cellgodsOrderId:a.order_id, streamUrl:a.stream_url,
      pinCiphertext:encryptPin(a.pin), expiresAt:new Date(a.expires_at), chargedCents:a.charged_cents })
  assert a.charged_cents <= rental.retailCents       // never sold below cost; else alert
catch (e):
  if e.status in {429,500,0}:  markActivationFailedTransient(s.id); return 500   // Stripe retries; CAS makes it safe
  if e.status == 402:          markActivationPendingCredit(s.id); alert; topup   // §7.3
  else /*409/400 terminal*/:   refund via AMERICELL Stripe; markRefunded(s.id); alert
markEventProcessed(event.id, event.type); return {received:true}
```
Drop the `customer.subscription.updated/deleted` cases (dead code for rentals).

### 7.3 Money safety
- **Integer cents everywhere**; retail computed server-side from live inventory; the client sends
  only `{ phoneId, period }`, never a price. Snapshot `wholesaleQuotedCents` + `retailCents`.
- **Never sell below wholesale** even when `suggested_retail` is null → fall back to `retailCentsFor`.
- **Never activate before confirmed payment**; never trust client `payment_status`/price/`orderId`.
- **402 path [RESOLVED — layered]:** (a) checkout preflight blocks the sale when `credit < wholesale`;
  (b) MVP webhook behavior on 402 = mark `activation_pending_credit` + ops alert + attempt `topup`
  (or rely on `auto_topup`); (c) **Phase-5 upgrade:** cron retry worker re-activates within a deadline
  (≈30 min), refunding via AMERICELL Stripe only if still failing. Refunds are **only** on AMERICELL
  Stripe — **never** call CellGods `/deactivate` to "refund" (no refund + phone lost).

### 7.4 Ownership & PIN/stream secrets
- Every stream/PIN read joins to `session.user.id` (`getRentalForUser`); 404/403 otherwise — mirrors
  the existing `getActiveSubscription` ownership gate.
- PIN encrypted at rest (`pinCiphertext`); decrypt only in the ownership-checked `/pin` route.
- `pin`/`stream_url` never appear in list endpoints, cached HTML, URLs, logs, or `generateMetadata`;
  these responses set `Cache-Control: no-store`. Don't serve a stale (>4h) `stream_url` as if fresh —
  surface the PIN.

### 7.5 Admin authorization
Authorize by **server-session email** vs `ADMIN_EMAILS` only — never a header/body/query/JWT-forgeable
flag. Gate both `/admin` pages (layout) and every `/api/admin/*` route.

### 7.6 Rate limits (Phase 5)
Outbound (`lib/cellgods` `cgFetch`): on 429/5xx retry idempotent **GETs** with backoff + jitter,
honor `Retry-After`; **never blind-retry `POST /activate`** (reconcile first). Inbound
(`lib/rate-limit.ts`): limit `/api/checkout`, `/api/rentals/[id]/*`, `/api/admin/*` keyed by
`userId`/IP → 429 + `Retry-After` (Upstash in prod, in-memory in dev).

---

## 8. Phased build checklist (in order)

**Phase 0 — Foundations**
- [ ] `.env.example`: replace `NEXT_PUBLIC_RESELLER_MARGIN_PCT` → server `RESELLER_MARGIN_PCT`; add
      `RESELLER_MARGIN_MIN_CENTS`, `PIN_ENCRYPTION_KEY`, `CRON_SECRET`; remove `REMOTE_PROVIDER_*`,
      `PRICE_*`.
- [ ] Polish `lib/cellgods.ts` (widen `suggested_retail` to `|null`; no `activate` auto-retry). Client is otherwise done.
- [ ] `lib/money.ts` (pure `fmtMoney`, `retailCentsFor`).
- [ ] `lib/pricing.ts` (`DURATIONS`, `PublicRetailPhone`, `wholesaleFor`, `toPublicRetailPhone`, `getRetailCatalog`).
- [ ] Delete `lib/devices.ts`.

**Phase 1 — Data model**
- [ ] `db/schema.ts`: add `integer` import + `rentals` table (keep `subscriptions`/`webhook_events`).
- [ ] `npm run db:generate` → `0001_*.sql`; `npm run db:migrate`.
- [ ] `lib/rentals.ts` (CAS helpers per §5.2).
- [ ] `lib/crypto.ts` (`encryptPin`/`decryptPin`).

**Phase 2 — Purchase + activation (money path)**
- [ ] Rewrite `app/api/checkout/route.ts` (`mode:"payment"`, live inventory, availability+credit preflight, `createPendingRental`, metadata).
- [ ] Rewrite `app/api/webhook/route.ts` handler (markPaid → beginActivation → activate → finalize/encrypt; drop subscription cases; §7.2 error branches).
- [ ] Optional `lib/activation.ts` (`activateRental()` shared by webhook + Phase-5 cron).

**Phase 3 — Customer UI**
- [ ] `components/pricing.tsx` → server `PricingSection` + client `PricingGrid` (duration toggle, live phones, posts `{phoneId, period}`). Update `app/page.tsx`.
- [ ] `app/dashboard/page.tsx` → read `rentals`; cards with countdown, PIN reveal, token freshness.
- [ ] New `app/api/rentals/[id]/access/route.ts` + `app/api/rentals/[id]/pin/route.ts` + `app/api/rentals/[id]/cancel/route.ts`.
- [ ] Rewire `components/remote-control-button.tsx` to `/access` (+ `/pin`); delete `app/api/devices/[id]/unlock/route.ts`; delete `lib/provider.ts`.
- [ ] `app/api/me/route.ts` → return `rentals`.

**Phase 4 — Admin panel**
- [ ] `lib/admin.ts`; `app/admin/layout.tsx` (+ `loading.tsx`, `error.tsx`).
- [ ] `app/admin/{page,inventory/page,orders/page,billing/page}.tsx`.
- [ ] `app/api/admin/*` proxy routes (Zod + `requireAdmin`).
- [ ] `npx shadcn add table dialog alert-dialog switch skeleton`; `components/admin/*`.

**Phase 5 — Hardening**
- [ ] 402 queued-activation + `app/api/cron/activate-pending` (CRON_SECRET) + refund-at-deadline.
- [ ] `app/api/cron/reconcile` (`getOrders` match + lazy-expire).
- [ ] `lib/rate-limit.ts` on money/entitlement/admin routes (Upstash prod).
- [ ] `server-only`/taint audit; verify no secret in any client bundle.

---

## 9. Exact file-change list

**Changed (existing):**
- `.env.example` — env swaps (§2).
- `db/schema.ts` — add `rentals` (+ `integer` import).
- `lib/cellgods.ts` — minor polish only (already implemented).
- `app/api/checkout/route.ts` — rewrite to reseller one-time payment.
- `app/api/webhook/route.ts` — rewrite handler; drop subscription cases.
- `app/api/me/route.ts` — return `rentals` instead of `subscriptions`.
- `app/dashboard/page.tsx` — read `rentals`; new card UI.
- `components/pricing.tsx` — split server/client, live inventory, duration toggle.
- `components/remote-control-button.tsx` — rewire to `/api/rentals/[id]/access` + `/pin`.
- `app/page.tsx` — render server `PricingSection`.

**Removed:**
- `lib/provider.ts` — superseded by `lib/cellgods.ts`.
- `lib/devices.ts` — superseded by `lib/pricing.ts`.
- `app/api/devices/[id]/unlock/route.ts` — replaced by `app/api/rentals/[id]/access` + `/pin`.

**New:**
- `lib/money.ts`, `lib/pricing.ts`, `lib/rentals.ts`, `lib/crypto.ts`, `lib/admin.ts`,
  `lib/activation.ts` (optional), `lib/rate-limit.ts` (Phase 5).
- `app/api/rentals/[id]/access/route.ts`, `.../pin/route.ts`, `.../cancel/route.ts`.
- `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/inventory/page.tsx`,
  `app/admin/orders/page.tsx`, `app/admin/billing/page.tsx`, `app/admin/loading.tsx`,
  `app/admin/error.tsx`.
- `app/api/admin/{inventory,orders,orders/activate,orders/deactivate,balance,ledger,topup,auto-topup}/route.ts`.
- `app/api/cron/activate-pending/route.ts`, `app/api/cron/reconcile/route.ts` (Phase 5).
- `components/admin/*` + shadcn `components/ui/{table,dialog,alert-dialog,switch,skeleton}.tsx`.

**Kept unchanged (reused):** `lib/db.ts`, `lib/stripe.ts`, `auth.ts`, `drizzle.config.ts`,
`lib/subscriptions.ts` (its `alreadyProcessed`/`markEventProcessed` `webhook_events` dedup is reused;
subscription helpers remain as dead legacy until the `subscriptions` table is dropped in a later
migration).
