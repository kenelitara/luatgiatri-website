/**
 * Vietnamese-aware slugify (spec §6.7). NFD-decompose, drop combining marks,
 * then map the two non-decomposing Vietnamese letters. The ONLY slug producer
 * in the codebase — used by Pages/Posts/Categories/Tags/Authors hooks and
 * admin seeds.
 */
export function slugify(input: string): string {
  return (
    input
      .normalize('NFD')
      // strip combining diacritics (tone marks + vowel marks) — U+0300–U+036F
      .replace(/[\u0300-\u036f]/g, '')
      // đ/Đ never decompose — map explicitly
      .replace(/[đĐ]/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
}
