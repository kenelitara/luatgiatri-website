import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { DEFAULT_BRAND } from '@/lib/metadata'
import { getSiteSettings } from '@/lib/site'

/**
 * Dynamic Open Graph cards (M3 Task 13): `/og/page/<slug>/` and `/og/post/<slug>/`,
 * 1200×630, brand plate + gold bar + the record's title.
 *
 * The reads below are fail-soft, but NOTE what that is for: this handler is
 * `ƒ (Dynamic)` — it is never executed during `next build`, so nothing about it
 * is baked. The try/catches cover runtime and ISR DB hiccups (a restart whose
 * first request lands before the pool is warm), where the brand-only card is a
 * better answer than a 500.
 *
 * `/og/...` is deliberately NOT in robots.txt's Disallow list (`/admin`, `/api/`)
 * — crawlable OG images are the point (social + link previews).
 */
// 60s to MATCH the record pages (`revalidate = 60` in src/app/(frontend)/**)
// rather than the plan's 3600: there is no on-demand revalidatePath/Tag in this
// project, so all healing is time-based, and an editor's title change would
// otherwise show on the page ~60× sooner than on the card. OG cards are
// crawler-only traffic, so the extra renders are negligible.
export const revalidate = 60
export const runtime = 'nodejs' // the brand font is read from disk

const OG_WIDTH = 1200
const OG_HEIGHT = 630

// brand-900 / gold-500, inlined because Tailwind classes do not apply inside
// satori. Values MUST stay in sync with `@theme` in src/app/globals.css.
const BRAND_900 = '#002147'
const GOLD_500 = '#ffd700'

const OG_FONT_FAMILY = 'Be Vietnam Pro'

/** Lines the title is clamped to before it would crowd the 630px card. */
const TITLE_LINES = 3

type OgFont = { name: string; data: Buffer; weight: 400 | 700; style: 'normal' }

/**
 * The site renders in Be Vietnam Pro (spec §6.8) but satori cannot read a
 * `next/font/google` face — it needs raw font bytes. The two TTFs are committed
 * under `public/fonts/` (copied into the standalone runner by the Dockerfile)
 * and read once per process, LAZILY: `readFileSync` may only run inside a
 * request, never at module evaluation, so a build-time import of this route
 * never touches disk.
 *
 * `undefined` = not attempted yet, `null` = load failed. On failure the `fonts`
 * option is omitted entirely so `@vercel/og` uses its bundled Geist face — which
 * also covers Vietnamese — rather than throwing "No fonts are loaded".
 */
let brandFonts: OgFont[] | null | undefined

function getBrandFonts(): OgFont[] | null {
  if (brandFonts !== undefined) return brandFonts
  try {
    const dir = path.join(process.cwd(), 'public', 'fonts')
    brandFonts = [
      {
        name: OG_FONT_FAMILY,
        data: readFileSync(path.join(dir, 'be-vietnam-pro-regular.ttf')),
        weight: 400,
        style: 'normal',
      },
      {
        name: OG_FONT_FAMILY,
        data: readFileSync(path.join(dir, 'be-vietnam-pro-bold.ttf')),
        weight: 700,
        style: 'normal',
      },
    ]
  } catch (err) {
    // Logged once per process (the cache above short-circuits retries): a
    // mis-provisioned runner image would otherwise serve Geist cards forever
    // with no signal at all.
    console.error('[og] brand font load failed; falling back to the bundled font:', err)
    brandFonts = null
  }
  return brandFonts
}

/** The record's display title. Unknown type / missing slug / no match all fall
 *  through to the brand-only card rather than throwing (Task 13 step D). */
async function resolveTitle(type: string | undefined, recordSlug: string | undefined, brand: string) {
  if (!type || !recordSlug) return brand
  try {
    const { getPayloadClient } = await import('@/lib/getPayload')
    const payload = await getPayloadClient()
    if (type === 'page') {
      const r = await payload.find({
        collection: 'pages',
        where: { slug: { equals: recordSlug } },
        limit: 1,
        draft: false,
      })
      return r.docs[0]?.primaryHeading ?? r.docs[0]?.title ?? brand
    }
    if (type === 'post') {
      const r = await payload.find({
        collection: 'posts',
        where: { slug: { equals: recordSlug } },
        limit: 1,
        draft: false,
      })
      return r.docs[0]?.title ?? brand
    }
  } catch (err) {
    // Without this, a renamed field / bad `where` / schema drift silently
    // degrades EVERY page and post card to brand-only.
    console.error('[og] title lookup failed:', { type, recordSlug }, err)
  }
  return brand
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const [type, recordSlug] = slug ?? []

  const settings = await getSiteSettings()
  const brand = settings.brandName || DEFAULT_BRAND
  const title = await resolveTitle(type, recordSlug, brand)

  const fonts = getBrandFonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BRAND_900,
          color: '#fff',
          padding: 64,
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, background: GOLD_500, borderRadius: 8 }} />
          <div style={{ fontSize: 32, fontWeight: 700 }}>{brand}</div>
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 1000,
            // Clamp long titles rather than letting them run off the fixed
            // 630px canvas. satori's clamp branch needs ALL of these together
            // (measured in @vercel/og's compiled satori: it reads
            // textOverflow + display:'-webkit-box' + WebkitBoxOrient:'vertical'
            // + a positive WebkitLineClamp).
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: TITLE_LINES,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>
        <div style={{ height: 8, width: 240, background: GOLD_500 }} />
      </div>
    ),
    { width: OG_WIDTH, height: OG_HEIGHT, ...(fonts ? { fonts } : {}) },
  )
}
