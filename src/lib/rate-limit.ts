export type RateLimitConfig = { windowMinutes: number; max: number }
export const LEAD_RATE_LIMIT: RateLimitConfig = { windowMinutes: 10, max: 5 }

/**
 * Tax-code lookup: at most 5 SOURCE FETCHES per 10 minutes per hashed IP (the
 * same shape as the lead form). A repeat lookup of a code we already cached is
 * served from our DB and does NOT count — this limits the load one visitor can
 * place on the third-party source, which is the whole point of the design.
 */
export const TAX_LOOKUP_RATE_LIMIT: RateLimitConfig = { windowMinutes: 10, max: 5 }

/**
 * DB-backed rate limit (spec §8): the caller supplies the count of recent
 * submissions for this IP hash — injectable, so the decision logic is
 * unit-testable and the query stays in the action. Survives container
 * restarts (an in-memory limiter resets and is trivially bypassable).
 */
export async function isRateLimited(
  countRecent: () => Promise<number>,
  cfg: RateLimitConfig = LEAD_RATE_LIMIT,
): Promise<boolean> {
  return (await countRecent()) >= cfg.max
}

/** Salted SHA-256 of the client IP — raw IPs are never stored (Nghị định 13). */
export async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
