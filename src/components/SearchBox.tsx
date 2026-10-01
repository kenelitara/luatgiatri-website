/** Search entry — plain GET form to /tim-kiem/ (no client component, no JS needed). */
export function SearchBox({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form
      action="/tim-kiem/"
      method="get"
      role="search"
      className="mx-auto flex max-w-md gap-2 px-4 pb-3"
    >
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Tìm kiếm dịch vụ, bài viết…"
        aria-label="Tìm kiếm"
        className="w-full rounded border border-brand-100 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
      >
        Tìm
      </button>
    </form>
  )
}
