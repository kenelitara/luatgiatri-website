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
}

export default withPayload(nextConfig)
