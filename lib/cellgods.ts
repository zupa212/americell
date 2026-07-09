import "server-only";

/**
 * CellGods Reseller API client — SERVER ONLY.
 *
 * The `server-only` import above makes the build fail if this module is ever
 * pulled into a client bundle, so the reseller API key can never leak to the
 * browser. Every call sends the key in the `X-API-Key` header; keys are read
 * from env and never returned to callers.
 *
 * Types mirror the VERIFIED live responses (the public docs are slightly
 * out of date — real inventory uses `type` and `price_monthly`).
 */

const API_BASE =
  process.env.CELLGODS_API_BASE ?? "https://api.cellgods.com/api/reseller";
const API_KEY = process.env.CELLGODS_API_KEY;

export const isCellgodsConfigured = Boolean(API_KEY);

// ── Errors ──────────────────────────────────────────────────────────────────

export class CellgodsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CellgodsError";
  }
}

/** Thrown on HTTP 402 — the reseller credit balance is too low to activate. */
export class InsufficientCreditError extends CellgodsError {
  constructor(message = "Insufficient reseller credit balance") {
    super(message, 402);
    this.name = "InsufficientCreditError";
  }
}

/** Thrown when CELLGODS_API_KEY is not configured. */
export class CellgodsNotConfiguredError extends CellgodsError {
  constructor() {
    super("CELLGODS_API_KEY is not set", 0);
    this.name = "CellgodsNotConfiguredError";
  }
}

// ── Types (from verified live responses) ─────────────────────────────────────

export type Platform = "android" | "iphone";
export type BillingPeriod = "daily" | "weekly" | "monthly";

export type InventoryPhone = {
  phone_id: string;
  model: string;
  type: Platform;
  status: string; // "available", ...
  price_daily: number | null;
  price_weekly: number | null;
  price_monthly: number | null; // cents
  suggested_retail: {
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
  } | null;
  currency: string;
};

export type AutoTopup = {
  enabled: boolean;
  threshold_cents: number;
  amount_cents: number;
  payment_method_on_file?: boolean;
};

export type Balance = {
  credit_balance_cents: number;
  currency: string;
  auto_topup: AutoTopup;
};

export type ActivateInput = {
  phone_id: string;
  customer_email: string;
  duration_days: number;
  billing_period?: BillingPeriod;
};

export type ActivateResult = {
  order_id: string;
  pin: string;
  stream_url: string;
  expires_at: string; // ISO
  charged_cents: number;
  billing_period: BillingPeriod;
  credit_balance_cents: number;
  currency: string;
};

export type Order = {
  order_id: string;
  phone_id: string;
  customer_email: string;
  status: string; // "active" | "pooled" | ...
  expires_at: string;
};

export type LedgerEntry = {
  delta_cents: number;
  balance_after_cents: number;
  reason: string;
  order_id?: string;
  created_at: string;
};

export type TopupInput = {
  amount_cents: number; // min 500
  success_url?: string;
  cancel_url?: string;
};

export type TopupResult = {
  checkout_url: string;
  session_id: string;
  amount_cents: number;
  currency: string;
};

// ── Core request helper ──────────────────────────────────────────────────────

type Envelope<T> = { success: true; data: T } | { success: false; error: string };

async function request<T>(
  path: string,
  init?: {
    method?: "GET" | "POST";
    body?: unknown;
    /**
     * When set, the response is cached by Next's Data Cache for this many
     * seconds (ISR-style). Omit for `no-store` — the default for every
     * money-critical call (balance, activate, checkout availability, …).
     */
    revalidate?: number;
  },
): Promise<T> {
  if (!API_KEY) throw new CellgodsNotConfiguredError();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        "X-API-Key": API_KEY,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
      ...(typeof init?.revalidate === "number"
        ? { next: { revalidate: init.revalidate } }
        : { cache: "no-store" }),
    });
  } catch (err) {
    throw new CellgodsError(
      `CellGods request failed: ${(err as Error).message}`,
      0,
    );
  } finally {
    clearTimeout(timeout);
  }

  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    // fall through to status-based error below
  }

  if (!res.ok || !json || json.success === false) {
    const message =
      json && json.success === false ? json.error : `HTTP ${res.status}`;
    if (res.status === 402) throw new InsufficientCreditError(message);
    throw new CellgodsError(message, res.status);
  }

  return json.data;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

/** LIVE inventory — no caching. Use at buy/activation time (availability must be fresh). */
export function getInventory(): Promise<InventoryPhone[]> {
  return request<InventoryPhone[]>("/inventory");
}

/**
 * BROWSE inventory — cached ~`revalidateSeconds` (default 45s) via Next's Data
 * Cache. Used for the public catalog/homepage so it renders instantly instead of
 * round-tripping CellGods on every request. NEVER use for checkout/activation.
 */
export function getInventoryForBrowse(
  revalidateSeconds = 45,
): Promise<InventoryPhone[]> {
  return request<InventoryPhone[]>("/inventory", { revalidate: revalidateSeconds });
}

export function getBalance(): Promise<Balance> {
  return request<Balance>("/balance");
}

export function activate(input: ActivateInput): Promise<ActivateResult> {
  return request<ActivateResult>("/activate", { method: "POST", body: input });
}

export function getOrders(): Promise<Order[]> {
  return request<Order[]>("/orders");
}

export function deactivate(
  orderId: string,
): Promise<{ order_id: string; status: string }> {
  return request("/deactivate", { method: "POST", body: { order_id: orderId } });
}

export function getLedger(): Promise<LedgerEntry[]> {
  return request<LedgerEntry[]>("/ledger");
}

export function topup(input: TopupInput): Promise<TopupResult> {
  return request<TopupResult>("/topup", { method: "POST", body: input });
}

export function setAutoTopup(input: {
  enabled: boolean;
  threshold_cents: number;
  amount_cents: number;
}): Promise<AutoTopup> {
  return request<AutoTopup>("/auto_topup", { method: "POST", body: input });
}
