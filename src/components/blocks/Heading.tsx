type Level = 2 | 3

/**
 * The ONLY component allowed to emit h2/h3 in blocks (spec §6.4).
 * Blocks render through this so heading levels are structurally
 * correct — there is no way for a block to skip a level.
 */
export function Heading({ level = 2, children }: { level?: Level; children: React.ReactNode }) {
  const Tag = `h${level}` as 'h2' | 'h3'
  return <Tag className="mb-3 font-semibold text-brand-900">{children}</Tag>
}
