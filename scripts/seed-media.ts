/**
 * scripts/seed-media.ts — download fixture images → Payload `media` (Task 20).
 *
 * Runs as TypeScript via tsx (not plain node) because the Payload Local API
 * needs the TS config via the `@payload-config` alias — same pipeline as
 * `pnpm seed`. Add the package script `seed:media` before `seed`.
 *
 * Pipeline:
 *  1. Scan seed/content/*.json (skipping _-prefixed files) for
 *     `{ "mediaRef": "<source URL>", "alt": "…" }` objects, plus the fixed
 *     EXTRA_ASSETS list (seed-assets.ts) for assets no fixture references —
 *     currently the site logo (an SVG, so Payload stores it with no
 *     `imageSizes`: sharp cannot rasterize SVG — expected and fine).
 *  2. For every unique URL not already in seed/content/_media-map.json:
 *     download it, upload it through the Local API
 *     (`payload.create({ collection: 'media', data: { alt }, file })`)
 *     and record `source URL → media id` in the map (deduped by URL, so the
 *     shared hero background is stored once).
 *  3. A dead URL is recorded as `"<url>": "__FAILED__"` and the run
 *     continues — a dead image must not kill the seed. Failures are reported
 *     at the end (and cause a non-zero exit so CI notices).
 *
 * Every image gets a real Vietnamese `alt` derived from its HTML context in
 * the raw capture (carried next to the mediaRef in the fixture) — the Media
 * schema rejects empty alts (spec §5.2).
 *
 * Env: Node's built-in `process.loadEnvFile()` loads .env — no dotenv needed.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { EXTRA_ASSETS } from './seed-assets'

type MediaMap = Record<string, number | '__FAILED__'>

try {
  process.loadEnvFile()
} catch {
  // no .env present — rely on the ambient environment
}

async function collectRefs(): Promise<Map<string, string>> {
  const dir = join(process.cwd(), 'seed/content')
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  const refs = new Map<string, string>() // url -> alt (first wins; deduped)
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk)
    } else if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      if (typeof obj.mediaRef === 'string') {
        const alt = typeof obj.alt === 'string' ? obj.alt : ''
        if (!refs.has(obj.mediaRef)) refs.set(obj.mediaRef, alt)
        return
      }
      Object.values(obj).forEach(walk)
    }
  }
  for (const file of files) {
    walk(JSON.parse(await readFile(join(dir, file), 'utf8')))
  }
  // Fixed assets not carried by any fixture (e.g. the site logo used by the
  // SiteSettings global) — first-wins dedupe matches the fixture walk.
  for (const asset of EXTRA_ASSETS) {
    if (!refs.has(asset.url)) refs.set(asset.url, asset.alt)
  }
  return refs
}

function filenameFromUrl(url: string): string {
  const base = new URL(url).pathname.split('/').pop() ?? 'image'
  // strip WordPress size suffixes (-1024x384) so the map survives re-captures
  return base.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '')
}

async function download(url: string): Promise<{ data: Buffer; mimetype: string; name: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = Buffer.from(await res.arrayBuffer())
  return {
    data,
    mimetype: res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg',
    name: filenameFromUrl(url),
  }
}

async function main() {
  // Imported AFTER .env is loaded: payload.config.ts reads DATABASE_URI at
  // module-evaluation time, so a static import would race the env setup.
  const { default: configPromise } = await import('@payload-config')
  const { getPayload } = await import('payload')
  const payload = await getPayload({ config: configPromise })
  const dir = join(process.cwd(), 'seed/content')
  const mapPath = join(dir, '_media-map.json')

  let map: MediaMap = {}
  try {
    map = JSON.parse(await readFile(mapPath, 'utf8')) as MediaMap
  } catch {
    // first run
  }

  const refs = await collectRefs()
  console.log(`media refs: ${refs.size} unique`)

  let created = 0
  let reused = 0
  const failures: string[] = []

  for (const [url, alt] of refs) {
    if (typeof map[url] === 'number') {
      reused++
      continue // already uploaded — idempotent re-runs
    }
    if (map[url] === '__FAILED__') {
      // retry on re-run in case the source recovered
    }
    if (!alt) {
      failures.push(`${url} — fixture carries no alt`)
      map[url] = '__FAILED__'
      continue
    }
    try {
      const file = await download(url)
      const doc = await payload.create({
        collection: 'media',
        data: { alt },
        file: { data: file.data, mimetype: file.mimetype, name: file.name, size: file.data.length },
      })
      map[url] = doc.id
      created++
      console.log(`uploaded: ${file.name} (id ${doc.id})`)
    } catch (err) {
      failures.push(`${url} — ${err instanceof Error ? err.message : String(err)}`)
      map[url] = '__FAILED__'
    }
  }

  await writeFile(mapPath, JSON.stringify(map, null, 2) + '\n', 'utf8')
  console.log(
    `media: ${created} uploaded, ${reused} reused, map has ${Object.keys(map).length} entries`,
  )
  if (failures.length) {
    console.error('FAILED downloads:')
    for (const f of failures) console.error('  ' + f)
    process.exit(1)
  }
  // The Payload DB pool keeps the event loop alive — exit explicitly.
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
