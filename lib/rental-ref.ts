/**
 * Human-readable transaction reference derived from a rental UUID.
 *
 * PURE and client-safe (intentionally NO `import "server-only"`): imported by
 * both the checkout routes (server) and the admin rentals table (client
 * component), so the reference on the customer's Stripe receipt is byte-identical
 * to the one the admin sees. It is a deterministic function of the rental's
 * existing UUID — no DB column and no migration.
 *
 * A canonical UUID's first hyphen is at index 8, so the first 8 chars are always
 * hex. Example: `550e8400-e29b-41d4-…` → `AMC-550E8400`.
 *
 * NOTE: the first 8 hex chars are a display/support reference, NOT a uniqueness
 * guarantee. The real idempotency/lookup keys remain the full `rentals.id`
 * (UUID) and `stripeSessionId`.
 */
export function rentalRef(id: string): string {
  return `AMC-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
