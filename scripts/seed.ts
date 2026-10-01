/**
 * scripts/seed.ts — fixtures → Payload Local API (Task 20).
 *
 * Reads every non-underscore JSON in seed/content/ and upserts it into the
 * `pages` collection by slug (idempotent re-runs update in place).
 *
 * Fixture indirection handled here:
 *  - `{ "mediaRef": "<url>", "alt": "…" }` objects are replaced with the media
 *    id recorded by `pnpm seed:media` in seed/content/_media-map.json
 *    (unmapped/failed refs become null — block views guard optional images;
 *    note: hero/servicePair images are schema-required, so a failed download
 *    surfaces as a per-page validation error that is reported, not swallowed).
 *  - `teamGrid.membersBySlug` (author slugs) is resolved to author ids via a
 *    single `authors` query at startup — chosen over hardcoding ids so the
 *    fixtures stay portable across fresh databases.
 *  - fixtures carry `_status: "published"` so draft-enabled pages are visible
 *    to the published-only queries of the public routes (Task 21).
 *
 * Foundation data (Task 24, gate finding): a wiped DB loses more than pages —
 * the admin user, the Authors, the news category and BOTH globals are otherwise
 * hand-created in the admin. The script now upserts them FIRST (idempotently),
 * before the page loop, because teamGrid resolves author slugs and pages
 * reference the category. The admin password is read from DEV_ADMIN_PASSWORD
 * in .env (gitignored); DEV_ADMIN_EMAIL is optional (default
 * dev-admin@luatgiatri.local). The user is only created when `users` is empty.
 *
 * Env: Node's built-in `process.loadEnvFile()` loads .env (PAYLOAD_SECRET,
 * DATABASE_URI, DEV_ADMIN_*) — no dotenv dependency.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { SITE_LOGO_URL } from './seed-assets'

type MediaMap = Record<string, number | '__FAILED__'>

type PageFixture = {
  title: string
  slug: string
  primaryHeading: string
  layout: unknown[]
  serviceMeta?: Record<string, unknown> | null
  _status?: string
}

try {
  process.loadEnvFile()
} catch {
  // no .env present — rely on the ambient environment
}

async function main() {
  // Imported AFTER .env is loaded: payload.config.ts reads DATABASE_URI at
  // module-evaluation time, so a static import would race the env setup.
  const { default: configPromise } = await import('@payload-config')
  const { getPayload } = await import('payload')
  const payload = await getPayload({ config: configPromise })

  const dir = join(process.cwd(), 'seed/content')
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json') && !f.startsWith('_'))

  let mediaMap: MediaMap = {}
  try {
    mediaMap = JSON.parse(await readFile(join(dir, '_media-map.json'), 'utf8')) as MediaMap
  } catch {
    // no media map yet — every mediaRef resolves to null
  }

  // ── Foundation data (Task 24) ─────────────────────────────────────────────
  // Idempotent upserts; run BEFORE the pages so author-slug resolution below
  // finds the Authors. A re-run over an already-seeded DB changes no records.

  // 1. Admin user — only on a fresh DB (the users collection is empty).
  const existingUsers = await payload.find({ collection: 'users', limit: 1 })
  if (existingUsers.totalDocs === 0) {
    const adminEmail = process.env.DEV_ADMIN_EMAIL || 'dev-admin@luatgiatri.local'
    const adminPassword = process.env.DEV_ADMIN_PASSWORD
    if (!adminPassword) {
      throw new Error(
        'DEV_ADMIN_PASSWORD missing from .env — cannot create the admin user (see .env.example)',
      )
    }
    await payload.create({
      collection: 'users',
      data: {
        email: adminEmail,
        password: adminPassword,
        fullName: 'Quản trị viên',
        roles: ['admin'],
      } as never,
    })
    console.log(`seeded admin user: ${adminEmail}`)
  } else {
    console.log(`admin user: ${existingUsers.totalDocs} present, skipped`)
  }

  // 2. Authors (spec §5.2 E-E-A-T surface) — upsert by slug.
  for (const author of [
    { slug: 'nguyen-minh-tri', name: 'Nguyễn Minh Trí' },
    { slug: 'le-thanh-hoa', name: 'Lê Thanh Hoa' },
  ]) {
    const { docs } = await payload.find({
      collection: 'authors',
      where: { slug: { equals: author.slug } },
      limit: 1,
    })
    if (docs.length) {
      await payload.update({ collection: 'authors', id: docs[0].id, data: author as never })
    } else {
      await payload.create({ collection: 'authors', data: author as never })
    }
    console.log(`seeded author: ${author.slug}`)
  }

  // 3. Default news category (Posts taxonomy) — upsert by slug.
  {
    const slug = 'tin-cong-ty'
    const data = { slug, title: 'Tin công ty' }
    const { docs } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (docs.length) {
      await payload.update({ collection: 'categories', id: docs[0].id, data: data as never })
    } else {
      await payload.create({ collection: 'categories', data: data as never })
    }
    console.log(`seeded category: ${slug}`)
  }

  // 4. Navigation global — the 8 header links (Task 10).
  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      headerItems: [
        { label: 'Trang chủ', href: '/' },
        { label: 'Giới thiệu', href: '/gioi-thieu/' },
        { label: 'Thành lập DN', href: '/thanh-lap-doanh-nghiep-tron-goi/' },
        { label: 'Kế toán', href: '/dich-vu-ke-toan/' },
        { label: 'Hóa đơn', href: '/hoa-don-dien-tu/' },
        { label: 'Chữ ký số', href: '/chu-ky-so-token/' },
        { label: 'Tin tức', href: '/tin-tuc/' },
        { label: 'Liên hệ', href: '/lien-he/' },
      ],
    },
  })
  console.log('seeded navigation: 8 header links')

  // 5. SiteSettings global — brand + NAP (footer + schema source of truth).
  // The header logo is uploaded by `seed:media` (its EXTRA_ASSETS entry, hence
  // no fixture reference); wire the mapped media id in when it exists so a
  // fresh DB reproduces the logo, and leave the field untouched otherwise.
  const mappedLogo = mediaMap[SITE_LOGO_URL]
  const logoId = typeof mappedLogo === 'number' ? mappedLogo : null
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      brandName: 'Luật Gia Trí',
      hotline: '0919088119',
      email: 'luatsu@luatgiatri.com',
      address: {
        street: '54/16 Đường số 2',
        district: 'Bình Tân',
        city: 'TP.HCM',
        country: 'VN',
      },
      ...(logoId ? { logo: logoId } : {}),
    },
  })
  console.log(`seeded site settings: brand + NAP${logoId ? ` + logo (media ${logoId})` : ''}`)

  // Resolve author slugs once (teamGrid.membersBySlug → relationship ids)
  const authorIds = new Map<string, number>()
  const authors = await payload.find({ collection: 'authors', limit: 100 })
  for (const author of authors.docs) {
    authorIds.set(String(author.slug), author.id)
  }

  const resolveMedia = (url: string): number | null => {
    const mapped = mediaMap[url]
    return typeof mapped === 'number' ? mapped : null
  }

  const transform = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(transform)
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      if (typeof obj.mediaRef === 'string') return resolveMedia(obj.mediaRef)
      if (Array.isArray(obj.membersBySlug)) {
        const ids = (obj.membersBySlug as string[]).map((slug) => authorIds.get(slug))
        const missing = (obj.membersBySlug as string[]).filter((slug, i) => ids[i] === undefined)
        if (missing.length) {
          throw new Error(`authors not found for slugs: ${missing.join(', ')}`)
        }
        // keep blockType/heading — only swap the slug list for resolved ids
        const { membersBySlug: _slugs, ...rest } = obj
        const outRest = transform(rest) as Record<string, unknown>
        return { ...outRest, members: ids }
      }
      const out: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) out[key] = transform(value)
      return out
    }
    return node
  }

  let failures = 0
  for (const file of files) {
    const fixture = JSON.parse(await readFile(join(dir, file), 'utf8')) as PageFixture
    const data = transform(fixture) as never
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: fixture.slug } },
      limit: 1,
    })

    try {
      if (existing.docs.length) {
        await payload.update({
          collection: 'pages',
          id: existing.docs[0].id,
          data,
        })
      } else {
        await payload.create({ collection: 'pages', data })
      }
      console.log(`seeded page: ${fixture.slug}`)
    } catch (err) {
      failures++
      console.error(`FAILED page ${fixture.slug}:`, err)
    }
  }

  if (failures) process.exit(1)
  // The Payload DB pool keeps the event loop alive — exit explicitly.
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
