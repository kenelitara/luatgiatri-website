import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: true, // spec §6.7 — URLs keep trailing slashes (live WordPress behavior)
  images: { formats: ['image/avif', 'image/webp'] },
}

export default withPayload(nextConfig)
