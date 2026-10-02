import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: true, // spec §6.7 — URLs keep trailing slashes (live WordPress behavior)
  images: {
    formats: ['image/avif', 'image/webp'],
    // NOTE: the fix for slashed media URLs lives in the DATA layer — the
    // Media collection's afterRead hook strips the trailing slash Payload
    // appends under `trailingSlash: true` (see src/payload/collections/Media.ts
    // and the "Media URLs" gotcha in AGENTS.md). A custom image loader was
    // tried and removed: with `loader: 'custom'` the built-in /_next/image
    // optimizer endpoint stops serving in this setup, and the hook alone is
    // sufficient because doc.url is already clean by the time next/image sees it.
  },
  /**
   * Draft Mode must never be indexable. A request that carries Next's draft
   * bypass cookie (`__prerender_bypass`) is serving UNPUBLISHED content, so it
   * gets `X-Robots-Tag: noindex, nofollow`.
   *
   * The cookie is only obtainable from the auth-gated `/next/preview` route
   * (it is unforgeable — see lib/draft-mode.ts), so a crawler can never reach
   * draft content in the first place; this header is the belt-and-braces layer
   * on top of the robots.txt exclusion for the `/next` tree. Declarative here
   * rather than in middleware: no new runtime file, and it applies to every
   * route (the pages a draft can be served at are arbitrary slugs).
   */
  async headers() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'cookie', key: '__prerender_bypass' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        // `/:path*` is zero-or-more, but list the root explicitly so `/` can
        // never slip past on a router-version edge.
        source: '/',
        has: [{ type: 'cookie', key: '__prerender_bypass' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default withPayload(nextConfig)
