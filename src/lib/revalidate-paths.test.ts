import { describe, expect, it } from 'vitest'
import {
  categoryChangePaths,
  categoryUrl,
  NEWS_INDEX_PATH,
  ogPageUrl,
  ogPostUrl,
  pageChangePaths,
  pageUrl,
  postChangePaths,
  postUrl,
  relationshipIds,
  relationshipSlugs,
  SITEMAP_PATH,
  uniquePaths,
} from './revalidate-paths'

describe('pageUrl', () => {
  it('maps the home record to the root (it is served at /, not /home/)', () => {
    expect(pageUrl('home')).toBe('/')
  })

  it('maps an ordinary slug to its trailing-slash URL', () => {
    expect(pageUrl('gioi-thieu')).toBe('/gioi-thieu/')
  })

  it('refuses a reserved root segment (never purges the admin/API tree)', () => {
    expect(pageUrl('admin')).toBeNull()
    expect(pageUrl('tin-tuc')).toBeNull()
  })

  it('returns null for empty / missing slugs', () => {
    expect(pageUrl(null)).toBeNull()
    expect(pageUrl(undefined)).toBeNull()
    expect(pageUrl('  ')).toBeNull()
  })
})

describe('the other URL builders', () => {
  it('builds the OG card URLs with the trailing slash', () => {
    expect(ogPageUrl('gioi-thieu')).toBe('/og/page/gioi-thieu/')
    expect(ogPostUrl('tin-1')).toBe('/og/post/tin-1/')
    expect(ogPageUrl('')).toBeNull()
    expect(ogPostUrl(undefined)).toBeNull()
  })

  it('builds the post and category archive URLs', () => {
    expect(postUrl('tin-1')).toBe('/tin-tuc/tin-1/')
    expect(categoryUrl('tu-van')).toBe('/tin-tuc/chuyen-muc/tu-van/')
    expect(postUrl(null)).toBeNull()
    expect(categoryUrl('')).toBeNull()
  })
})

describe('relationship readers', () => {
  it('reads slugs from populated docs', () => {
    expect(relationshipSlugs([{ slug: 'a' }, { slug: 'b' }])).toEqual(['a', 'b'])
  })

  it('ignores bare ids when reading slugs', () => {
    expect(relationshipSlugs([1, 2])).toEqual([])
    expect(relationshipSlugs(undefined)).toEqual([])
    expect(relationshipSlugs('nope')).toEqual([])
  })

  it('reads ids from either shape (the depth-dependent case)', () => {
    expect(relationshipIds([1, 2])).toEqual([1, 2])
    expect(relationshipIds([{ id: 3 }, { id: 'x' }])).toEqual([3, 'x'])
    expect(relationshipIds(null)).toEqual([])
  })
})

describe('uniquePaths', () => {
  it('drops nulls and de-duplicates while keeping order', () => {
    expect(uniquePaths(['/a/', null, '/b/', '/a/', undefined])).toEqual(['/a/', '/b/'])
  })
})

describe('pageChangePaths', () => {
  it('purges the page, its OG card and the sitemap', () => {
    const paths = pageChangePaths('gioi-thieu')
    expect(paths).toContain('/gioi-thieu/')
    expect(paths).toContain('/og/page/gioi-thieu/')
    expect(paths).toContain(SITEMAP_PATH)
  })

  it('purges the ROOT for the home record', () => {
    expect(pageChangePaths('home')).toContain('/')
  })

  it('purges BOTH URLs when the slug changed (old one is now a 404)', () => {
    const paths = pageChangePaths('new-slug', 'old-slug')
    expect(paths).toContain('/new-slug/')
    expect(paths).toContain('/old-slug/')
    expect(paths).toContain('/og/page/old-slug/')
  })

  it('does not duplicate when the slug is unchanged', () => {
    const paths = pageChangePaths('gioi-thieu', 'gioi-thieu')
    expect(paths.filter((p) => p === '/gioi-thieu/')).toHaveLength(1)
  })
})

describe('postChangePaths', () => {
  it('purges the post, the news index, its OG card and the sitemap', () => {
    const paths = postChangePaths({ slug: 'tin-1' })
    expect(paths).toContain('/tin-tuc/tin-1/')
    expect(paths).toContain('/og/post/tin-1/')
    expect(paths).toContain(NEWS_INDEX_PATH)
    expect(paths).toContain(SITEMAP_PATH)
  })

  it('purges every category archive the post belongs to — old AND new', () => {
    const paths = postChangePaths({
      slug: 'tin-1',
      categorySlugs: ['tu-van'],
      previousCategorySlugs: ['tin-cong-ty'],
    })
    expect(paths).toContain('/tin-tuc/chuyen-muc/tu-van/')
    expect(paths).toContain('/tin-tuc/chuyen-muc/tin-cong-ty/')
  })

  it('purges the old post URL when the slug changed', () => {
    expect(postChangePaths({ slug: 'new', previousSlug: 'old' })).toContain('/tin-tuc/old/')
  })

  it('does not touch category archives when the post has none', () => {
    const paths = postChangePaths({ slug: 'tin-1' })
    expect(paths.some((p) => p.includes('/chuyen-muc/'))).toBe(false)
  })
})

describe('categoryChangePaths', () => {
  it('purges the archive, the news index and the sitemap', () => {
    const paths = categoryChangePaths('tu-van')
    expect(paths).toContain('/tin-tuc/chuyen-muc/tu-van/')
    expect(paths).toContain(NEWS_INDEX_PATH)
    expect(paths).toContain(SITEMAP_PATH)
  })

  it('purges the old archive URL when the category slug changed', () => {
    const paths = categoryChangePaths('new-cat', 'old-cat')
    expect(paths).toContain('/tin-tuc/chuyen-muc/new-cat/')
    expect(paths).toContain('/tin-tuc/chuyen-muc/old-cat/')
  })

  it('is precise: a category edit never purges an unrelated post URL', () => {
    const paths = categoryChangePaths('tu-van')
    expect(paths.some((p) => /^\/tin-tuc\/[^/]+\/$/.test(p))).toBe(false)
  })
})
