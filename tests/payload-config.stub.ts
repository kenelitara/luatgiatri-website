/**
 * vitest-only stand-in for the `@payload-config` tsconfig alias.
 *
 * Components under test (Renderer → FormEmbedView → LeadForm) statically import
 * the lead server action, which imports `@/lib/getPayload` and with it the real
 * `payload.config.ts` (postgres adapter + sharp). Unit tests never invoke the
 * action, so vitest resolves the alias to this stub instead — the same
 * "keep the DB layer out of the vitest graph" split as `search-text.ts`
 * (AGENTS.md, Task 8b). The real config loads in Next at runtime (build, dev,
 * `next start`).
 */
export default {}
