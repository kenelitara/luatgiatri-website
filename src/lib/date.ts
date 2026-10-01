/** Vietnamese date convention: "ngày 15 tháng 8 năm 2026" (spec §5.7). */
export function formatViDate(date: Date | string): string {
  const d = new Date(date)
  return `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`
}
