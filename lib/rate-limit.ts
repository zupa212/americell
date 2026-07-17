/**
 * Tiny in-memory fixed-window rate limiter. No deps, works in both the Edge
 * (proxy) and Node (route/auth/actions) runtimes.
 *
 * NOTE: state is per-instance and ephemeral (serverless), so this is best-effort
 * brute-force throttling — it stops naive hammering of a single instance. For
 * hard, distributed limits use the Vercel WAF/BotID or an Upstash/Redis store.
 *
 * The store is hard-capped at MAX_KEYS with O(1) insertion-order eviction, so a
 * flood of distinct (attacker-influenced) keys can never grow it without bound.
 */
type Entry = { count: number; resetAt: number };

const MAX_KEYS = 20_000;
const store = new Map<string, Entry>();

function put(key: string, entry: Entry): void {
  // Evict the oldest inserted key when at capacity (bounds memory, O(1) — no
  // full-map scan on the hot path).
  if (!store.has(key) && store.size >= MAX_KEYS) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, entry);
}

/**
 * Generic per-window limiter. Counts every call; allows `limit` calls per
 * `windowMs`, then returns ok:false until the window rolls over.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const e = store.get(key);

  if (!e || e.resetAt <= now) {
    put(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (e.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((e.resetAt - now) / 1000) };
  }
  e.count += 1;
  return { ok: true, remaining: limit - e.count, retryAfter: 0 };
}

/** Current failure count for a key (0 once the window lapses). */
export function failureCount(key: string): number {
  const e = store.get(key);
  if (!e || e.resetAt <= Date.now()) return 0;
  return e.count;
}

/** Record one failure against a key, (re)opening a window as needed. */
export function recordFailure(key: string, windowMs: number): void {
  const now = Date.now();
  const e = store.get(key);
  if (!e || e.resetAt <= now) {
    put(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  e.count += 1;
}

/** Clear a key (e.g. on a successful login, so real users are never penalised). */
export function resetKey(key: string): void {
  store.delete(key);
}
