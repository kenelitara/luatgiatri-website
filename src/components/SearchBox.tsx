/**
 * Search entry — plain GET form to /tim-kiem/ (no client component, no JS needed).
 *
 * LAYOUT-AGNOSTIC BY DESIGN: the component renders only the form's own flex row
 * and the control styling. The CALLER supplies the placement (positioning /
 * width / alignment) through `className`, so the same box can sit right-aligned
 * in the thin dark top bar (TopBar) or in a page-width column without the
 * positioning living inside the component. Keep that split — a hardcoded
 * `mx-auto max-w-md` is what kept this out of the top bar before.
 */
export function SearchBox({
  defaultValue = '',
  className = '',
}: {
  defaultValue?: string
  className?: string
}) {
  return (
    <form
      action="/tim-kiem/"
      method="get"
      role="search"
      className={`flex items-center gap-1.5 ${className}`}
    >
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Tìm kiếm dịch vụ, bài viết…"
        aria-label="Tìm kiếm"
        // max-sm:text-base (16px) stops iOS Safari's focus zoom on the narrow
        // screens; the fixed h-7 means the larger type does not change the bar height.
        className="h-7 w-full min-w-0 rounded border border-slate-300 bg-white px-2.5 text-sm text-brand-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f908a] max-sm:text-base"
      />
      <button
        type="submit"
        className="h-7 shrink-0 rounded bg-gold-500 px-3 text-sm font-semibold text-brand-900 hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f908a]"
      >
        Tìm
      </button>
    </form>
  )
}
