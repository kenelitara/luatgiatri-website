import { getDbPool } from '@/lib/db'

export type SearchResult = {
  type: 'page' | 'post' | 'category'
  title: string
  url: string
  excerpt: string | null
  score: number
}

/**
 * Trim/collapse the raw query and cap its length — a hostile input must not
 * blow up the tsearch parse (and an overlong query is never a real one).
 */
export function normalizeQuery(raw: string | undefined | null): string {
  return (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

/** Map a DB row to a public result (pure — unit-testable without a DB). */
export function toResult(row: {
  type: SearchResult['type']
  title: string
  slug: string
  excerpt: string | null
  score: number
}): SearchResult {
  const url =
    row.type === 'page'
      ? row.slug === 'home'
        ? '/'
        : `/${row.slug}/`
      : row.type === 'post'
        ? `/tin-tuc/${row.slug}/`
        : `/tin-tuc/chuyen-muc/${row.slug}/`
  return { type: row.type, title: row.title, url, excerpt: row.excerpt, score: row.score }
}

/**
 * Diacritic-insensitive search across pages, posts and categories (spec §7).
 * `unaccent()` runs on BOTH sides — `ke toan` matches `kế toán`.
 * Pages are labelled with `primaryHeading` (falling back to the internal
 * `title`) so a result list shows the same heading the page itself renders.
 */
export async function searchAll(rawQuery: string, limit = 20): Promise<SearchResult[]> {
  const q = normalizeQuery(rawQuery)
  if (!q) return []
  const { rows } = await getDbPool().query<{
    type: SearchResult['type']
    title: string
    slug: string
    excerpt: string | null
    score: number
  }>(
    `WITH q AS (SELECT websearch_to_tsquery('simple', unaccent($1)) AS tsq)
     SELECT 'page' AS type, COALESCE(primary_heading, title) AS title, slug, NULL::text AS excerpt,
            ts_rank(search_vector, q.tsq) AS score
     FROM pages, q WHERE search_vector @@ q.tsq
     UNION ALL
     SELECT 'post', title, slug, excerpt, ts_rank(search_vector, q.tsq)
     FROM posts, q WHERE search_vector @@ q.tsq
     UNION ALL
     SELECT 'category', title, slug, NULL, ts_rank(search_vector, q.tsq)
     FROM categories, q WHERE search_vector @@ q.tsq
     ORDER BY score DESC LIMIT $2`,
    [q, limit],
  )
  return rows.map(toResult)
}
