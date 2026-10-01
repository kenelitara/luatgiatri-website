/**
 * Renders a JSON-LD payload into a script tag.
 *
 * Every "<" is replaced with its JSON unicode escape before serialisation,
 * so a literal closing script tag inside page content (e.g. a Lexical body
 * quoted in an FAQ answer) can never terminate the tag early — the JSON stays
 * valid and the document is safe.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  // an empty schema set (e.g. home, which has no breadcrumb) emits no script
  // rather than a meaningless `<script>[]</script>`
  if (Array.isArray(data) && data.length === 0) return null
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
