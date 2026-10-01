/**
 * Brand mark for the admin's logo slots (login, logout, verify).
 *
 * Registered as `admin.components.graphics.Logo` in `payload.config.ts`.
 * Payload 3.90.2 reads exactly that key and renders this component in place of
 * its own `PayloadLogo` — `@payloadcms/next/dist/elements/Logo/index.js` does
 * `RenderServerComponent({ Component: CustomLogo, Fallback: PayloadLogo })`.
 * That is the PUBLIC extension point, so nothing here depends on a private
 * class name the way the old `.login__brand .graphic-logo` CSS hack did.
 *
 * Rendered on a light plate (`.admin-brand` in `src/app/(payload)/custom.scss`).
 * The reason is contrast, not decoration: the monogram in `/icon.svg` is brand
 * navy `#002147` plus gold, and navy measures 1.02:1 against the dark admin
 * canvas (`#1e1e2c`) — on a dark login only the gold fragment was visible. On a
 * light plate the navy is 16.05:1 in both themes.
 *
 * A plain `<img>`, NOT `next/image`, for the same reason as the public site's
 * header logo (see AGENTS.md "UI notes — hero ratio & site logo"): Next's
 * optimiser rejects SVG unless `dangerouslyAllowSVG` is enabled globally, a
 * security toggle we deliberately do not flip for one static vector asset that
 * needs no resizing.
 */
export function AdminBrand() {
  return (
    <span className="admin-brand">
      <img src="/icon.svg" alt="Luật Gia Trí" width={72} height={72} />
    </span>
  )
}
