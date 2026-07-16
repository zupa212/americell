/**
 * Tiny in-memory fixed-window rate limiter. No deps, works in both the Edge
 * (middleware) and Node (route/auth) runtimes.
 *
 * NOTE: state is per-instance and ephemeral (serverless), so this is best-effort
 * brute-force throttling — it stops naive hammering of a single instance. For
 * hard, distributed limits use the Vercel WAF/BotID or an Upstash/Redis store.
 */
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const e = store.get(key);

  if (!e || e.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic cleanup so the map can't grow unbounded.
    if (store.size > 5000) {
      for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
    }
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (e.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((e.resetAt - now) / 1000) };
  }

  e.count += 1;
  return { ok: true, remaining: limit - e.count, retryAfter: 0 };
}
