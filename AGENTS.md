# luatgiatri-website — Agent rules

Stack-specific rules and gotchas for this project. The workspace `CLAUDE.md`
at the monorepo root covers conventions that apply to every project; this
file is for things that ONLY apply here.

## Stack

- Framework: Next.js 16.3.6 (app router, Turbopack, standalone output)
- CMS: Payload 3.90.2, embedded in the Next app under `src/app/(payload)/`
- Admin UI language: Vietnamese (`i18n.supportedLanguages: { vi }`)
- Database: Postgres 16 (Docker, dev publishes 127.0.0.1:5432)
- Package manager: pnpm 10.x
- Node: >=22.12 (engine requirement; dev machine runs 22.22.2)

## Versions with breaking changes from training data

- **Next.js 16** — `params`/`searchParams` are Promises; dev server rewrites
  `tsconfig.json` (jsx → `react-jsx`, adds `.next/dev/types`) and appends an
  `AGENTS.md` agent-rules block on every `next dev`. Commit those, don't fight
  them. Read `node_modules/next/dist/docs/` before touching router APIs.
- **Payload 3.90.2** — route group files are generated-file shapes from the
  official template (`RootPage`/`NotFoundPage`/`generatePageMetadata`/`RootLayout`),
  NOT the older `Admin`/`AdminView`/`export const GET = REST` pattern. See
  "Verified APIs (M1)" below.
- **tsx must stay pinned to 4.22.4** (same as Payload's own template) —
  `payload`'s `bin.js` hardcodes workarounds for that version.

## Project-specific gotchas

- **`package.json` MUST keep `"type": "module"`.** Without it, Node loads
  `payload.config.ts` as CJS, tsx turns its imports into `require()`, and every
  `payload` CLI command dies with `ERR_REQUIRE_ASYNC_MODULE` on
  `@payloadcms/richtext-lexical` (an ESM package with top-level await).
  Payload's official templates all set `"type": "module"`.
- **Multiple root layouts**: there is NO `src/app/layout.tsx`. The site lives
  in `src/app/(frontend)/` and Payload in `src/app/(payload)/`; each group's
  layout is a root layout rendering its own `<html>`. Payload's `RootLayout`
  renders `<html>/<body>` itself — never nest it under another root layout or
  you get nested-`<html>` hydration errors.
- **Dev DB access**: dev runs the app on the host (`pnpm dev`), so
  `docker-compose.yml` publishes `127.0.0.1:5432` and `.env`'s `DATABASE_URI`
  points at `127.0.0.1:5432`. In-container dev (`docker compose up app`)
  gets the in-network address automatically — both compose files override
  `DATABASE_URI` in their `environment:` block to `db:5432` (see the
  Docker-stack section below).
- **First admin navigation in dev may throw `ERR_TOO_MANY_REDIRECTS`** while
  Turbopack compiles the admin chunk; a retry succeeds. Verified harmless.
- **`src/app/(payload)/admin/importMap.js` is generated** by
  `pnpm generate:importmap` (also auto-regenerated on dev/build). Re-run it
  after adding admin custom components.
- **Payload CLI requires `tsconfig.json` at runtime** (known Payload bug —
  `findConfig()` crashes without it). Never delete it.
- **pnpm blocks build scripts** (esbuild warning on install). Harmless so far;
  if a tool needs its postinstall, approve it via `pnpm.onlyBuiltDependencies`.
- **`next-env.d.ts` flip-flops**: `next dev` points it at `.next/dev/types`,
  `next build` at `.next/types`. It will look dirty after alternating commands;
  commit whichever variant and move on.

## Verified APIs (M1)

Checked against `payloadcms/payload` tag `v3.90.2` (templates/website) and
installed `node_modules`, 2026-10-01. Template wins over plan.

- **`src/app/(payload)/layout.tsx`** — plan assumed a trivial layout (CSS
  import + `return children`). Template: `RootLayout` from
  `@payloadcms/next/layouts` wrapping children with `config`, generated
  `importMap`, and a `'use server'` `serverFunction` via
  `handleServerFunctions`. Used the template shape.
- **`src/app/(payload)/admin/[[...segments]]/page.tsx`** — plan assumed
  `<Admin {...{ params, searchParams }} />` and an `AdminViewProps` type
  (neither exists; `dist/views/Admin/` is absent). Template: `RootPage` +
  `generatePageMetadata` from `@payloadcms/next/views`, taking
  `{ config, params: Promise<{segments: string[]}>, searchParams, importMap }`.
  Used the template shape.
- **`src/app/(payload)/admin/[[...segments]]/not-found.tsx`** — plan assumed
  `<AdminView />`. Template: `NotFoundPage` + `generatePageMetadata` with the
  same `{ config, params, searchParams, importMap }` args. Used the template
  shape.
- **`src/app/(payload)/api/[...slug]/route.ts`** — plan assumed
  `export const GET = REST` (bare `REST`/`GraphQL` exports: they don't exist).
  Template: `REST_GET(config)` … `REST_OPTIONS(config)` factory calls; there
  is no `REST_HEAD` in 3.90.2, so no `HEAD` export. GraphQL lives in its own
  files: `api/graphql/route.ts` (`GRAPHQL_POST(config)`) and
  `api/graphql-playground/route.ts` (`GRAPHQL_PLAYGROUND_GET(config)`).
- **`src/app/(payload)/logout/[[...segments]]/page.tsx`** — plan listed it;
  the 3.90.2 website and blank templates have NO logout route group (no
  `LogoutView` is exported). Logout is `/admin/logout`, served by the admin
  catch-all. File intentionally not created.
- **`@payloadcms/translations/languages/vi`** — exists in 3.90.2; exports
  `{ vi, viTranslations }`. Admin renders fully in Vietnamese
  (login, create-first-user, dashboard, nav, buttons verified in browser).
- **`payload.config.ts` top-level `upload`** — plan set
  `upload: { staticURL: '/media', staticDir: 'data/media' }`; in 3.90.2 the
  top-level `upload` is only `FetchAPIFileUploadOptions` (express-fileupload
  options). `staticDir` belongs on the upload-enabled collection;
  `staticURL` does NOT exist in 3.90.2 at all (Payload 2 API — no such key
  in `UploadConfig`, verified against installed types). Uploads are also
  NOT served at `/{slug}` — Task 11 curl-verified `/media/<filename>`
  returns 404. Payload 3.90.2 builds URLs as
  `config.routes.api + '/{slug}/file/{filename}'` (see
  `generateFilePathOrURL` in `payload/dist/uploads/`), so `slug: 'media'`
  serves at `/api/media/file/<filename>`; the `url`/`sizes.*.url` fields
  on media docs use exactly that path.
  The Media collection (Task 10, pulled forward from Task 11 so
  `SiteSettings.defaultOgImage` could point at `relationTo: 'media'` without
  a config-load failure; option (a) of the plan's ordering note) therefore
  sets only `staticDir: 'data/media'`. (`data/` is gitignored wholesale
  already, so `data/media/` needs no extra entry.)
- **Media upload + sharp** — 3.90.2 warns at config load that image resizing
  needs `sharp` passed into the config. sharp has been in `package.json`
  since M1; the gap was that it was never passed into `buildConfig` (fixed
  in M2: `sharp,` in `payload.config.ts`). Without the wiring, resizing
  silently no-ops.
- **`payload.config.ts` i18n** — plan used `fallbackLanguage: true`; the TS
  type requires a language string (`fallbackLanguage: 'vi'`). Payload's
  sanitizer resolves unsupported fallbacks to the first supported language
  anyway; with `vi` as the only language both produce a fully-Vietnamese
  admin. Used `fallbackLanguage: 'vi'`.
- **`pnpm payload migrate:create`** — wrote `src/migrations/20261001_042023.ts`
  (a `.ts` file, not the `*_users.js` the plan expected), no confirmation
  prompt. `pnpm payload migrate` reported `Migrated: 20261001_042023`.
- **`src/app/layout.tsx` + `src/app/page.tsx`** — plan did not mention them,
  but Payload's `RootLayout` renders its own `<html>/<body>`, so the scaffold
  root layout caused nested-`<html>` hydration errors. Restructured to the
  template's multiple-root-layouts layout: site moved to
  `src/app/(frontend)/{layout,page}.tsx`, top-level layout removed.
- **`package.json` `"type": "module"`** — every Payload 3.90.2 official
  template sets it; without it the `payload` CLI cannot load
  `payload.config.ts` as ESM (full failure chain in Project-specific
  gotchas above). Non-negotiable.
- **Collection-level `admin.livePreview` (Task 12)** —
  `admin.livePreview: { url }` on a collection alone enables Live Preview
  for it (root-level `admin.livePreview.collections: string[]` is optional;
  verified in `@payloadcms/ui/dist/utilities/handleLivePreview.js`). BUT a
  plain string `url` is used verbatim as the preview iframe `src` — 3.90.2
  has NO `{field}` placeholder interpolation (the plan's
  `url: '/tin-tuc/{slug}'` would literally 404). Per-doc URLs must be
  functions: `url: ({ data }) => (data?.slug ? `/tin-tuc/${data.slug}` : null)`.
  Posts uses the function form; until Task 21 adds the front-end route, the
  preview iframe 404s (accepted for M2).
- **`defaultSortBy` does NOT exist in 3.90.2** (Payload 2 API — zero hits
  across installed `payload/dist`). Dropped from the Authors collection in
  Task 12; admin list-view ordering is per-user preference or request-level
  `sort` only.
- **First `richText` field requires `pnpm generate:importmap` (Task 12)** —
  Posts added the project's first `richText` field and dev served the edit
  view with `getFromImportMap: PayloadComponent not found` for
  `@payloadcms/richtext-lexical/rsc#RscEntryLexicalField` until the
  importMap was regenerated. Run that command after adding field types with
  admin components; the auto-regeneration does not pick them up mid-dev-session.
- **Task-14 shape verifications — all three plan forms are valid in 3.90.2,
  no deltas needed** (checked against installed `payload/dist` types,
  2026-10-01): (1) `filterOptions` on a relationship field accepts a plain
  `Where` object — `FilterOptions = FilterOptionsFunc | null | Where` — so
  `filterOptions: { slug: { in: [...] } }` typechecks; `in` is a valid
  operator (`validOperators` in `dist/types/constants.d.ts`). (2) `minRows`
  exists on array fields (`minRows?: number` in `dist/fields/config/types.d.ts`);
  `minRows: 1` on HeroCarousel slides is fine. (3) `admin.condition` is
  `(data, siblingData, { blockData, operation, path, user })`; for a TOP-LEVEL
  group field `siblingData` is the other top-level doc fields, so
  `siblingData?.slug` reads the parent document's slug (Pages.serviceMeta
  condition verified show/hide by direct invocation). Also: the `blocks` and
  `select` field types do NOT need importMap regeneration — the generated
  importMap only holds richtext-lexical components; core field components
  resolve inside `@payloadcms/ui`, and the pages create view served cleanly
  with all 13 block labels.

## Verified APIs (M3)

Task 6 — SEO panel custom admin component (SERP preview + live character
counters). Checked against installed `payload@3.90.2` / `@payloadcms/ui@3.90.2`
and the `v3.90.2` website template, 2026-10-01.

- **Plan assumptions that HELD (no delta):**
  1. The `ui` field type exists — `UIField` (`type: 'ui'`, `name: string`) in
     `payload/dist/fields/config/types.d.ts`; it is in the `Field`/`ClientField`
     unions and `FieldPresentationalOnly = UIField`.
  2. `admin.components.Field` accepts the string form — `PayloadComponent =
false | RawPayloadComponent | string` (`payload/dist/config/types.d.ts`),
     and `UIField.admin.components.Field?: CustomComponent` (=`PayloadComponent`).
     `parsePayloadComponent` (`dist/bin/generateImportMap/utilities/`) splits on
     `#` into path + export name; the string is stored in the importMap verbatim
     (alias/package form) or joined to the importMap→baseDir relative path
     (leading `.`/`/` form).
  3. `useFormFields` IS exported from `@payloadcms/ui`
     (`dist/exports/client/index.d.ts` re-exports it from
     `dist/forms/Form/context.js`). Signature:
     `<Value>(selector: (ctx: FormFieldsContextType) => Value) => Value` where
     `FormFieldsContextType = [FormState, Dispatch]`. **The plan's `([fields]) =>`
     destructuring is correct** — the callback receives the `[fields, dispatch]`
     tuple.
- **Delta 1 — `@payloadcms/ui` was not a direct dependency.** The scaffold
  omitted it (the official 3.90.2 template lists it, e.g. for
  `@/components/BeforeLogin`). Without it neither `tsc` nor the bundler can
  resolve `@payloadcms/ui` from `src/` (`node -e "import('@payloadcms/ui')"`
  from the project root fails; pnpm does not hoist it). Added
  `"@payloadcms/ui": "3.90.2"` to `package.json` dependencies.
- **Delta 2 — FormState is a FLAT dotted-path map, not nested.** `FormState =
{ [path: string]: FieldState }` and `getFieldPaths`
  (`payload/dist/fields/getFieldPaths.js`) builds `path = parentPath + '.' +
field.name`. So `fields['seo.metaTitle'].value` is right and the plan's
  `fields.seo.metaTitle.value` reads `undefined` — the counters would sit at
  `0/60` forever while still rendering. The component uses dotted keys
  (`'seo.metaTitle'`, `'seo.metaDescription'`, `'primaryHeading'`).
- **Delta 3 — component path uses the tsconfig alias form.** This project's
  `payload.config.ts` sits at the repo ROOT, so `admin.importMap.baseDir`
  defaults to `process.cwd()` (the root) — a leading-slash path would resolve to
  `<root>/components/...`, not `src/components/...`. The official template sets
  `importMap.baseDir: path.resolve(dirname)` and its config lives in `src/`, so
  its `/components/…` works there; here the baseDir-independent alias form
  `@/components/admin/SeoPreview#SeoPanel` is used (it matches the template's
  own `@/components/BeforeLogin` convention).
- **Delta 4 — Tailwind is NOT in the admin bundle.** `src/app/(payload)/layout.tsx`
  imports only `@payloadcms/next/css` + `custom.scss`; `globals.css` (Tailwind)
  is imported by the `(frontend)` layout alone. The plan's counter colours used
  Tailwind classes (`text-amber-600` …), which would be inert in the admin; the
  component uses inline hex styles instead (same as the SERP card).
- **Generated entry** (in `src/app/(payload)/admin/importMap.js`):
  `import { SeoPanel as SeoPanel_<hash> } from '@/components/admin/SeoPreview'`
  and `"@/components/admin/SeoPreview#SeoPanel": SeoPanel_<hash>`. The running
  dev server wrote it on its recompile of the `seo.ts` edit before
  `pnpm generate:importmap` ran (which then reported "No new imports found").
- **Admin render verification — the M2 "grep the served HTML" method is NOT
  sufficient for client-rendered field components.** The served admin HTML
  contains `SeoPanel` only as an RSC client reference
  (`I[<moduleId>,[chunks…],"SeoPanel"]`) — the document edit form renders
  client-side, so the counter strings are absent from the SSR HTML. Verified
  instead with headless chromium (Playwright) against a `next start -p 3100`
  build: the panel renders with live values — the SERP title falls back to
  `primaryHeading` when metaTitle is empty, and typing a 37-char metaTitle flips
  the counter to `37/60` and the SERP title to the typed text, with zero console
  errors. Pages has `versions: { drafts: true }` but NO autosave, so the browser
  test persisted nothing (page 9's `metaTitle` stayed `null`).

Task 8b — the search_vector write hook MUST run on the request transaction.

- The plan's `afterChange` hook wrote the vector through M1's `getDbPool()` — a
  **separate** pg connection. Payload runs `afterChange` INSIDE the write
  transaction (`updateByID` calls `commitTransaction` only after the document
  hooks), so the just-written row is already locked; the second connection then
  blocks **forever** on that row lock — an application-level deadlock Postgres
  cannot detect (the lock holder is not itself waiting on a DB lock). Symptom:
  `payload.update` / every admin save hangs indefinitely while `findByID` is
  fine. `pnpm reindex` does not hit it (it writes directly, no transaction).
- Fix: run `UPDATE … to_tsvector('simple', unaccent(…))` on the transaction's
  **own session**, resolved exactly as Payload's `getTransaction` does:
  `adapter.sessions[await req.transactionID]?.db ?? adapter.drizzle`, then
  `session.execute(sql\`…\`)`with`sql`re-exported from`@payloadcms/db-postgres` (`sql.identifier(table)` for the table, values bound
  as params). The vector then commits atomically with the content — a rolled-back
  write rolls the vector back too, so no drift.
- Dev schema push is now **disabled project-wide**: `payload.config.ts` sets
  `postgresAdapter({ push: false })` (verified option in
  `@payloadcms/db-postgres@3.90.2` — `push?: boolean` in `dist/types.d.ts`;
  the connect gate is `this.push !== false` in `dist/connect.js`). Before this,
  any column that migrations own outside Payload's field system — the raw
  `search_vector` columns (Task 8a) and earlier ones (TokenMatrix,
  showOverlay, logo/priceRange) — read as schema drift, and dev push offered to
  **DROP** it on every `pnpm dev` / `pnpm seed` / tsx script run ("DATA LOSS
  WARNING"). This is the same root cause behind all the previous "dev-pushed
  column" dances. With `push: false`, migrations are the single source of truth
  in EVERY environment (spec §11.2) and the whole prompt class is gone — so the
  `reindex` script needs no `PAYLOAD_MIGRATING` workaround (it was removed;
  `pnpm reindex` and `pnpm seed` now run prompt-free on the dev DB). In
  development, schema changes are `pnpm payload migrate:create` +
  `pnpm payload migrate`; a fresh dev DB must migrate before `pnpm seed`.
- **Live incident (2026-10-01, Task 11) — `push: false` validated in the wild.**
  The dev server on :3000, booted hours earlier (pre-`search_vector` migration,
  pre-fix), recompiled and blocked on the DATA LOSS prompt to delete
  `search_vector` in categories (1 item) and pages (10 items). Killed
  unanswered; all three columns and all 10 vectors verified intact; the restart
  on current code booted with no prompt and no warning. This answers the Task 8b
  review's open question (a second dev server could not be booted then — Next's
  single-instance lock).
- **Pre-`push: false` databases keep their old `batch: -1` dev record**, so
  `pnpm payload migrate` still shows the dev-mode "data loss" prompt on THIS dev
  DB (Task 11 met it) until the DB is recreated — the M3 gate will meet it too.
  Answering `y` there is the documented dev path; it is the _schema push_ prompt
  that must never be answered `y`.
- `searchableText` lives in `src/lib/search-text.ts`, NOT in the hook module:
  the hook imports the runtime pg adapter, so the split keeps the pure text
  builder unit-testable without dragging the DB layer into the vitest graph.

Task 11 — lead capture (rate limit, server action, form, FormEmbed block).
Verified 2026-10-01 against the built app (`next start -p 3100`), not dev.

- **`payload.count` with a DOTTED-path `where` works in 3.90.2 — no SQL
  fallback needed.** The plan's contingency (a raw `getDbPool()` count) was not
  required: `where: { and: [{ 'compliance.ipHash': { equals } }, { submittedAt:
{ greater_than } }] }` returned the expected count. The rate limit was proven
  end-to-end in the browser — 5 submissions created 5 rows, the 6th returned the
  throttle message and created nothing.
- **`access.create: () => false` on Leads is the REST lock-out; the action is
  the only writer.** `submitLead` writes through the Local API with
  `overrideAccess: true`. Do NOT relax the collection access to "fix" a 403 —
  the browser must never be able to POST a lead.
- **The `submitLead` action takes ONLY `FormData`; `useActionState` calls its
  action with `(prevState, formData)`.** `LeadForm` therefore wraps it
  (`async (_prev, formData) => submitLead(formData)`) — passing `submitLead`
  directly would hand it the previous state as the FormData and throw.
- **vitest resolves the `@payload-config` alias to `tests/payload-config.stub.ts`
  (added with this task).** `Renderer` → `FormEmbedView` → `LeadForm` → the lead
  action → `@/lib/getPayload` → `@payload-config`; without the stub the
  Renderer test drags `payload.config.ts` (postgres adapter + sharp) into the
  test graph and dies on the unresolved alias. Same "keep the DB layer out of
  vitest" split as `search-text.ts` (Task 8b). The real config still loads in
  Next.
- **`Pages.layout` registers 15 blocks** (was 14) — `formEmbed` is the 15th
  (`src/payload/blocks/FormEmbed.ts`, migration `20261001_105457`). The block
  view uses `Heading` for its `<h2>`; the form itself emits no headings.
- **The lead form is the site's only data-submitting JS island.** Attribution
  (sourcePage/sourceUrl/referrer/UTMs) is captured client-side after hydration
  into hidden inputs — the values only exist in the browser.
- **The honeypot's zod message is Vietnamese on purpose.** A bare `.max(0)`
  leaked Zod's English default (`Too big: expected string to have <=0
characters`) into the action's response; the field now carries
  `'Yêu cầu không hợp lệ'`. Bots get a rejection, never a hint.

Task 12 — consent banner gating GA4.

- **REVISED (post-M3-gate fix, 2026-10-01): the measurement id now comes from
  `SiteSettings.ga4Id`, NOT a build arg.** The original mechanism (kept below)
  was a two-sources-of-truth trap: an env var that WAS the source, beside a DB
  field that existed and did nothing, with a warning telling operators not to
  use it — so the id could not be changed without a rebuild and a redeploy.
  The DB field is now the single source: `(frontend)/layout.tsx` reads it
  server-side from `getSiteSettings()` and passes it to
  `<ConsentBanner ga4Id={settings.ga4Id ?? undefined}>`. Empty/NULL ⇒ no banner
  and no analytics script, exactly as before. The `ARG`/`ENV` pair, the compose
  `args:` entry, the `.env`/`.env.example` entries and the DEPLOYMENT.md rows
  were all deleted — there is NO env fallback, deliberately (that would
  re-create the trap).
- **Still true and still useful: `NEXT_PUBLIC_*` is inlined at `pnpm build`
  time.** Next replaces every `process.env.NEXT_PUBLIC_X` reference with the
  build-time literal, so a value of that class can only change via a rebuild.
  `SITE_ENV` and `NEXT_PUBLIC_SERVER_URL` are build args for exactly this
  reason. GA4 does not need one any more because it is now read server-side and
  passed as a PROP — a prop is data, not an inlined constant, which is what
  makes DB-sourcing it work at all. Historical note: the original verification
  command `NEXT_PUBLIC_GA4_ID=G-TEST123 next start -p 3100` against a default
  build never proved anything (the banner grep returned 0).
- **The banner's presence is baked into PRERENDERED HTML, so a build only
  carries the id if it is in the DB BEFORE `pnpm build`** (afterwards the
  layout's own render heals within the ~60 s ISR window). `scripts/ga4-id.ts`
  (`pnpm ga4:set <id>` / `pnpm ga4:clear`, house style of
  `scripts/reindex-search.ts`) makes the e2e gate reproducible: set → build →
  start → `pnpm e2e` → clear. `clear` writes NULL, not `''`, so the asserted
  DB state is `ga4_id IS NULL`. There is deliberately NO GA4 id in
  `scripts/seed.ts` — the seed runs in production too, and seeding a real id
  would switch analytics on for live traffic.

Task 13 — dynamic OG images (`next/og`). Verified 2026-10-01 against a built
app (`next start -p 3100`), not dev.

- **Satori cannot use a `next/font/google` face — it needs raw font bytes.**
  `ImageResponse` renders through satori, so the site's Be Vietnam Pro
  (`src/app/(frontend)/layout.tsx`) is unreachable from the OG route. Two TTFs
  (`public/fonts/be-vietnam-pro-{regular,bold}.ttf`, from `google/fonts`) are
  committed and read once per process with
  `readFileSync(path.join(process.cwd(), 'public', 'fonts', …))`. `process.cwd()`
  (not `import.meta.url`) is the load-bearing resolver: in the standalone runner
  the route compiles to `/.next/server/app/og/[...slug]/route.js`, so a
  module-relative path would point inside `.next/server`. `public/` is copied
  wholesale by `Dockerfile`'s runner stage (`COPY --from=builder /app/public
  ./public`) and `.dockerignore` does NOT exclude it — both checked, or the
  build would silently ship a fontless image.
- **`ImageResponse`'s `fonts` option REPLACES `@vercel/og`'s bundled default —
  it does not merge.** Measured in `next/dist/compiled/@vercel/og/index.node.js`:
  `fonts: options.fonts || defaultFonts`. Two consequences: (1) when `fonts` is
  passed, the built-in face is gone, so every element must name the family
  (`fontFamily: 'Be Vietnam Pro'`) or satori has nothing to match; (2) an EMPTY
  array is **truthy**, so `fonts: []` selects zero fonts and satori throws
  `No fonts are loaded`. The route therefore omits the key entirely on a load
  failure (`...(fonts ? { fonts } : {})`) instead of passing `[]`.
- **Vietnamese glyphs — verified by looking at the PNG, both paths.** Next 16.3.6
  bundles exactly one OG font, `Geist-Regular.ttf` (the stale JSDoc in
  `@vercel/og`'s `types.d.ts` claims "Noto Sans Latin Regular" — it is wrong).
  Parsing its `cmap` showed all 74 precomposed Vietnamese characters in the
  U+1EA0–1EF9 block map to real glyphs (not `.notdef`), and a rendered card
  confirmed it: `/og/page/gioi-thieu` → "Giới thiệu về Luật Gia Trí" with every
  diacritic correct in both the Be Vietnam Pro card (true bold) and the
  fonts-missing fallback card (Geist regular). No `fontWeight` synthesis: satori
  renders 400 when only 400 exists, so the design's `fontWeight: 700` is a no-op
  without the committed bold TTF.
- **OG precedence is 3-tier, and the generated route is LAST.** The plan's
  prose ("when neither `seo.ogImage` nor `settings.defaultOgImage` exists") and
  its shorthand (`ogImage: mediaUrl(…) ?? '/og/page/x'`) disagree; the prose
  wins, because putting the generated URL in `ogImage` would make
  `SiteSettings.defaultOgImage` dead for every page and post. `MetadataInput`
  gained `fallbackOgImage`, and `buildMetadata`'s image chain is
  `ogImage ?? defaultOgImage ?? fallbackOgImage`. Both are NULL in the current
  DB, so the observable result is the same today.
- **The advertised OG URL MUST carry the trailing slash.** `trailingSlash: true`
  makes `/og/page/<slug>/` the canonical, directly-servable form; the bare
  `/og/page/<slug>` **308s** to it. `buildMetadata`'s `absoluteOrNull` only
  prepends the base — it does NOT normalise slashes — so the slash has to be in
  the value `seo-helpers.ts` emits. Same failure class as the media-URL
  redirect above: strict OG fetchers that do not follow a 308 lose the image
  entirely. Verified with `curl`-equivalent against the built app:
  `/og/page/gioi-thieu/` → `200`, 0 redirects.
- **`/og/[...slug]` shape.** One `route.tsx` serves both `/og/page/<slug>/` and
  `/og/post/<slug>/` (`revalidate = 60`, `runtime = 'nodejs'`). `revalidate` is
  a deliberate DEVIATION from the plan's 3600: every record page uses 60 and
  there is no on-demand `revalidatePath`/`revalidateTag` anywhere in the
  project, so all healing is time-based — at 3600 an editor's title change would
  reach the card up to 60× later than the page. OG traffic is crawler-only, so
  the extra renders are negligible. The build marks the route `ƒ (Dynamic)` — it
  is never executed during `next build`, so a DB-less docker build cannot fail
  on it, and nothing about it is baked (which is also why the "heal the baked
  card" phrasing does not apply here: the try/catches cover runtime/ISR DB
  hiccups, not build-time prerender). Verified with `next start` (2026-10-01):
  `/og/page/{gioi-thieu,home}/` → `200 image/png`; `/og/page` (no slug),
  `/og/page/` (bare trailing), `/og/post/khong-ton-tai` and `/og/bogus/x` all →
  `200 image/png` brand-only cards (never a 500); `/og` bare → `404` (a
  `[...slug]` catch-all needs at least one segment). `next/og`'s own fallback is
  what makes the malformed paths safe.
- **Both fail-soft catches log.** `console.error('[og] title lookup failed:',
  { type, recordSlug }, err)` and `'[og] brand font load failed; …'` — matching
  the `src/lib/db.ts` / `src/app/api/health/route.ts` convention. Without them a
  renamed field, a bad `where` or a mis-provisioned runner image degrades every
  card to brand-only with no signal at all. Both fire at runtime only (the route
  is dynamic); the font one is LATCHED by the process-level font cache, so it
  logs once, not per request.
- **The title is clamped to 3 lines** (`display: '-webkit-box'` +
  `WebkitBoxOrient: 'vertical'` + `WebkitLineClamp` + `textOverflow: 'ellipsis'`)
  so a long `Post.title` truncates with an ellipsis instead of running off the
  fixed 630px canvas. satori's clamp branch requires all four together — read
  off its compiled source, same technique as the `fonts` finding above. Verified
  with a 160-char title: the card stays in bounds.
- **`DEFAULT_BRAND` is the single source for the brand string.** Exported from
  `src/lib/metadata.ts`; imported by `src/lib/site.ts`'s
  `SITE_SETTINGS_FALLBACK` (the effective brand when the DB is down — i.e. what
  the OG card depends on) and by the nine `(frontend)` routes' DB-less
  `generateMetadata` fallbacks. The dependency is acyclic: `metadata.ts` imports
  only `site-env.ts`, which imports nothing.
- **`/og` stays OUT of robots.txt on purpose.** `disallow: ['/admin', '/api/']`
  does not cover it, and crawlable OG images are the point (social + link
  previews). Do not "tidy" it in.
- **DB-less build re-proved for this route** (the same technique as Task 12):
  a full `pnpm build` with `DATABASE_URI` pointed at a closed port exited 0 and
  the baked `.next/server/app/gioi-thieu.html` contained ZERO
  `/og/page/gioi-thieu` occurrences — i.e. the DB really was unreachable, the
  `getPage`/`getSiteSettings` try/catch fallbacks took over, and the build still
  succeeded. On the DB-connected build the same file DOES bake the generated
  `og:image`, which is what the curl check asserts.

## M3 gate findings (Task 15, 2026-10-01) — gate RED on the sitemap (now FIXED); no `m3-seo` tag

- **RED at the gate, FIXED since: `/sitemap.xml` was prerendered once at build
  and never healed — a post published at runtime never entered it.**
  `src/app/sitemap.ts` carried no route
  segment `revalidate` (the record pages export `export const revalidate = 60`;
  the sitemap does not), so Next emits `/sitemap.xml` as `○ (Static)`.
  Evidence on a `next start -p 3100` build: the response is
  `Cache-Control: public, max-age=0, must-revalidate` with `x-nextjs-cache: HIT`
  and NO `x-nextjs-stale-time` in `.next/server/app/sitemap.xml.meta` (contrast
  `.next/server/app/tin-tuc.meta`, which HAS one), and the baked
  `.next/server/app/sitemap.xml.body` stays at its build-time `<loc>` count. A
  temp post created via the Local API appeared in the news index (ISR 60) after
  ~60 s but NEVER in the sitemap across 75 s of polling. The source comment
  ("ISR heals at runtime") asserts behaviour the code does not implement — and
  it contradicts the M2 convention that DB-dependent routes are ISR. Real SEO
  defect for a firm that authors articles in the CMS: a new post is invisible to
  crawlers until the next deploy. The gate's post-path check requires the
  sitemap to pick the post up, so the gate is RED. **The production impact is
  not theoretical:** the production image is built DB-LESS (the builder stage
  carries no `DATABASE_URI`; `docker-compose.vps.yml` passes only
  `SITE_ENV`/`NEXT_PUBLIC_SERVER_URL`), so `sitemap()`'s catch bakes an EMPTY
  `<urlset>` — verified by running the built `lg-m3-prod` image on :3100
  against the live dev DB via `host.docker.internal`: it served
  `<urlset …></urlset>` with **0** `<loc>` and stayed empty beyond 90 s.
  **FIX (post-gate): `export const dynamic = 'force-dynamic'` in
  `src/app/sitemap.ts` — the sitemap is now generated on demand, so it is
  correct on the FIRST request of a fresh container, with no DB at build time
  and no healing window.** `revalidate = 60` would also have healed it, but
  only AFTER a ~60 s window in which Googlebot can still fetch the empty
  build-time file — a smaller copy of the very bug being fixed, re-created on
  every deploy; a sitemap is fetched by crawlers a few times a day, so
  on-demand generation is negligible cost for a correctness guarantee.
  `force-dynamic` is a valid route-segment option here (`sitemap.ts` is a
  special Route Handler, cached by default unless it uses a dynamic option, and
  `cacheComponents` is NOT enabled in `next.config.ts` — see the Next docs in
  `node_modules/next/dist/docs/…/metadata/sitemap.md` and
  `…/02-route-segment-config/index.md`).
- **No other route output of the Part A class exists.** `/tin-tuc/` and
  `/tin-tuc/chuyen-muc/[slug]/` both export `revalidate = 60` (ISR, so they
  self-heal, and the gate observed the news index pick up a runtime post);
  `/robots.txt` is `○ (Static)` by design and has NO DB dependency (pure
  `SITE_ENV` config); `/og/[...slug]` is `ƒ (Dynamic)`; `/api/health` is
  `force-dynamic`. There is no feed/RSS, `opengraph-image` or `manifest`
  route output.
- **`/robots.txt` is likewise `○ (Static)`, but that is by design** (its content
  is build-baked from `SITE_ENV`, like the metadata).
- **The rest of the production image is fine, and the page metadata DOES heal.**
  `robots.txt` serves the full prod contract (`Allow: /`, `Allow: /api/media/`,
  `Disallow: /admin`, `Disallow: /api/`, a `Sitemap:` line, no blanket
  `Disallow: /`). Page routes are baked as the `notFound()` fallback in the
  DB-less build (that is the documented M2 convention — `getPage`'s catch
  returns null, the page calls `notFound()`), and ISR self-heals them: the first
  hit 404s, the body heals within one revalidation, and by the NEXT cycle the
  served HTML carries the real `<title>`, `<meta name="description">` and an
  ABSOLUTE canonical on `https://luatgiatri.com`. Do not read the first-hit 404
  or the title-less intermediate render as a gate failure — only the sitemap is
  RED.
- **Admin chrome has no English leak.** Nav group heading is `Bộ sưu tập`; nav
  icons render on 11/11 rows. The only ASCII-ish strings in the served chrome
  are `Tiêu đề (admin)` (OUR own Pages label, `src/payload/collections/Pages.ts:40`)
  and `Cấu hình chung (globals)` — the latter is the upstream `vi` language
  pack's own value (`@payloadcms/translations/dist/languages/vi.js:314`), not a
  leak of ours. **Superseded 2026-10-01:** `general.globals` is now overridden
  to `'Cấu hình chung'` (see the i18n-override list in the Stack rules section);
  `Tiêu đề (admin)` is still ours and still deliberate.
- **The Lexical `Invalid indent value` crash is gone on the served build.**
  Opening `chinh-sach-bao-mat` (which mounts a richText block editor) in the
  :3100 admin mounts `.editor-container` with no error boundary and 0 console
  errors. Console entries pointing at `localhost:3000` chunks (the dev server)
  or at a token-less `/api/users/logout` are NOT this build — do not read them
  as gate failures. The M2-era "grep the served HTML" method is still
  insufficient: the SEO panel and the OG cards were verified by driving a real
  browser (counters flip `0/60` → `34/60` amber while typing a 34-char meta
  title, and the SERP title follows the typed value; `/og/page/gioi-thieu/` and
  `/og/post/<slug>/` render the navy card + gold accent bar).

## Meta descriptions are DERIVED, never authored (spec §10.1 item 4)

- **Defect (fixed 2026-10-01):** `pageMetadata` set
  `description: page.seo?.metaDescription || undefined` — no fallback — so 9 of
  11 public pages emitted NO `<meta name="description">`, while `postMetadata`
  had carried an excerpt chain since M1. The crawl gate (`crawl.spec.ts`)
  asserts a description on all 11.
- `seo-helpers.ts` now exposes `pageDescription()` with the chain
  `seo.metaDescription` → `serviceMeta.shortDescription` → first `richText` block
  body (through `lexicalText`) → `primaryHeading`, capped at
  `META_DESCRIPTION_MAX` (160) on a **word boundary** by the shared
  `truncateText()`. 160 matches the admin SEO panel counter
  (`SeoPreview.tsx` DESC_MAX). No new copy is authored (content law, spec §3.2) —
  every tier is already-ported content.
- **Handover flags:** `lien-he` falls to its first `richText` block, which is the
  contact block ("Địa chỉ: … Email: … Phone: …") — a poor SERP description.
  `home` has NO richText block at all, so it lands on `primaryHeading`. Both want
  a hand-written `seo.metaDescription` from the client.
- `staticMetadata` is deliberately unchanged — `/tin-tuc/` supplies its own
  description and there is no record to derive from.

## Stack rules — Payload 3.90.2 + Next 16.3.6

- Payload is **embedded**: no separate backend, no REST from the browser. Public
  pages read via the Local API; the lead form uses a server action (M3). Never
  call Payload REST from client components.
- **Admin UI is Vietnamese** (`i18n.supportedLanguages: { vi }`). Every new
  collection/field/block label is written in Vietnamese. Content `localization`
  is NOT enabled and must not be enabled (single-locale site, spec §5.7).
- **Overriding Payload's own Vietnamese strings — `i18n.translations`.** The
  `vi` language pack ships one untranslated string: `general.collections`
  = `'Collections'`, which renders as the "Collections" group heading in the
  admin nav/dashboard (`@payloadcms/translations/dist/languages/vi.js`; the
  sibling `general.allCollections` is already `'Tất cả Bộ sưu tập'`, so
  `'Bộ sưu tập'` is the consistent term). `payload.config.ts`'s `i18n` block
  carries
  `translations: { vi: { general: { collections: 'Bộ sưu tập', globals:
  'Cấu hình chung' }, fields: { block: 'Khối', blocks: 'Khối', blockType:
  'Loại khối', searchForBlock: 'Tìm khối', toggleBlock: 'Bật/tắt khối' } } }`.
  The shape is `Partial<{ [lang]: <full translations object> }>` on
  `I18nOptions`, but the config type is `I18nOptions<{} | DefaultTranslationsObject>`
  so a nested partial typechecks; at runtime `initI18n`'s `initTFunction`
  deep-merges it OVER the language pack (`deepMergeSimple(pack, config.translations[lang])`),
  so only the overridden leaf is needed. Add further overrides the same way.
  `fields.searchForBlock` is the block drawer's search placeholder (the pack
  ships it half-translated as `'Tìm block'`); the drawer TITLE is a different
  key (`fields.addLabel` + the blocks field's `labels.singular`) — see "Adding a
  new block" below. `fields.toggleBlock` (the block collapse toggle's
  aria-label) and `general.globals` (the globals nav-group heading, on every
  admin screen) were the pack's other half-translated strings
  (`'Bật/tắt block'`, `'Cấu hình chung (globals)'`) — both overridden
  2026-10-01. Deliberately NOT overridden, because they read as correct in
  Vietnamese software: `authentication.apiKey` "API Key", `general.email`
  "Email", `general.menu` "Menu".

  **The full i18n-override list (what is already patched, and why):**

  | key | pack's value | override | why |
  | --- | --- | --- | --- |
  | `general.collections` | `Collections` | `Bộ sưu tập` | untranslated EN; the "Collections" nav/dashboard group heading |
  | `general.globals` | `Cấu hình chung (globals)` | `Cấu hình chung` | half-EN on every admin screen |
  | `fields.block` / `blocks` | `Block` / `blocks` | `Khối` | every block here is labelled in Vietnamese |
  | `fields.blockType` | `Block Type` | `Loại khối` | untranslated EN |
  | `fields.searchForBlock` | `Tìm block` | `Tìm khối` | half-EN; the block-drawer search placeholder |
  | `fields.toggleBlock` | `Bật/tắt block` | `Bật/tắt khối` | half-EN; the block collapse toggle's aria-label |

  Two levers do NOT go through `i18n.translations`:
  a field's own `label` (our code) and **the `labels` vs `label` lever below**.

- **`labels` vs `label` — the row-title trap (the systematic leak, fixed
  2026-10-01).** Payload's field sanitizer does
  `field.labels = field.labels || formatLabels(field.name)`
  (`payload/dist/fields/config/sanitize.js`) — but **only for `array` and
  `blocks` fields that have a `label`**. So a field with a `label` and no
  `labels` silently gets its collapsed-row title derived from its **English
  field `name`**. `ArrayRow.js` renders
  `` `${getTranslation(labels.singular, i18n)} ${index+1}` `` (zero-padded), and
  the array's "Thêm: …" add-row button uses the same `labels.singular`. That is
  the mechanism that produced "Layout"/"Thêm: Layout" for the `layout` blocks
  field (fixed earlier) and "Item 01", "Row 01", "Group 01", "Section 01",
  "Column 01", "Slide 01", "Bullet 01", "Step 01", "Logo 01", "Header Item 01"
  … for the 15 arrays (fixed 2026-10-01). **Every `array`/`blocks` field must
  carry an explicit `labels: { singular, plural }`.** `group` fields are NOT
  affected (the sanitizer skips them, and Payload's `Group` component consumes
  `label`, not `labels`). Vietnamese has no plural inflection, so `singular` and
  `plural` are the same string — that is correct. `labels` are **admin-only
  metadata: no migration, and the field `name` (and DB column) must not change.**
  Current explicit array `labels`: `logos`/Logo, `items`/Câu hỏi (faq),
  `items`/Mục (featureGrid), `slides`/Ảnh trình chiếu (heroCarousel — the array
  `label` was 'Slide' and was changed to 'Ảnh trình chiếu' too, so the form and
  its rows agree; the BLOCK label "Hero nhiều slide" is untouched), `groups`/
  Nhóm + `rows`/Dòng (pricingTable), `steps`/Bước (processSteps), `bullets`/Mục
  (servicePair), `items`/Nhận xét (testimonials), `sections`/Nhóm sản phẩm +
  `columns`/Cột + `rows`/Dòng + `cells`/Ô (tokenMatrix), `headerItems`/Mục menu
  + `footerLinks`/Liên kết (navigation).

- **`SEO > Panel` in the list-view column selector — fixed the same way.**
  `seo.panel` is a data-less `ui` field, but Payload's `combineFieldLabel` util
  joined the parent group's label with the field's auto-derived name label
  ("panel") and listed it as a column pill. `UIField` renders no label of its
  own, so the fix is `admin: { disableListColumn: true }` on the field
  (`ColumnSelector` filters on `field.admin.disableListColumn`) — not a `label`.

- **Known English strings that CANNOT be fixed from this config** (all verified
  against the installed packages, 2026-10-01; none are `t()`-translatable):

  | string | where it shows | source |
  | --- | --- | --- |
  | `MIME Type`, `Thumbnail URL`, `URL` | Media list header + column selector | `payload/dist/uploads/getBaseFields.js` — hardcoded `label:` on the auto-added upload fields (the sibling `filename`/`filesize`/`width`/`height` DO use `t('upload:…')`) |
  | `Copy URL` | media edit view copy tooltip | `@payloadcms/ui/dist/elements/FileDetails/FileMeta` passes `defaultMessage="Copy URL"` to `CopyToClipboard`, which prefers `defaultMessage` over `t('general:copy')` |
  | `Drag to move`, `Add block`, `Insert Paragraph`, `Edit link`, `Remove link` | Lexical editor aria-labels | hardcoded in `@payloadcms/richtext-lexical/dist/lexical/plugins/**` |
  | `Responsive` | Live Preview device dropdown | `@payloadcms/ui/dist/providers/LivePreview/index.js` — hardcoded `label: 'Responsive'` |
  | `Notifications alt+T` | empty toast live-region aria-label | `sonner@1.7.4` (bundled by Payload's Toaster) builds it as `` `${label} ${shortcut}` ``; `Toaster` accepts a `label` prop but Payload does not pass one |
  | `alt="yas"` | account avatar `<img>` | literal `alt: "yas"` in `@payloadcms/ui/dist/graphics/Account/Gravatar/index.js` — an upstream bug |

  Deliberately left in English because they are the standard term in Vietnamese
  software / a proper noun / an acronym: `Slug`, `Icon`, `Hotline`, `Logo`,
  `Email`, `Menu`, `SEO`, `URL`, `API Key`, `GA4 Measurement ID`, `Referrer`,
  `MIME`, and the `utm_source`/`utm_medium`/`utm_campaign` query-param names.
  `sameAs` (Authors) is the schema.org property name, and its admin
  `description` already tells the editor what to enter.
- **`SITE_ENV` is a build arg**, not a runtime knob — prerendered `robots.ts`
  and metadata bake it at build (spec §6.5; mechanism detailed in the Docker
  section below). Verify staging `noindex` against the built image, never
  `pnpm dev`.
- **Migrations are one-shot and never run on container start** — a restart must
  not be able to change the schema (spec §11.2). Dev: `pnpm payload migrate` on
  the host against the dev DB; in-container: the `migrate` compose service
  (commands in the Docker section below). The schema is migration-owned in every
  environment — the adapter sets `push: false` (Task 8b), so `pnpm dev` / seed /
  scripts never push; a fresh dev DB must run `pnpm payload migrate` before
  `pnpm seed` (the README documents this).
- **Two volumes**: `./data/db` (Postgres) and `./data/media` (Payload uploads).
  Losing `data/media` loses every uploaded image while the DB still references
  them — both go in VPS backups. On a real Linux host, bind-mount ownership
  requires a pre-flight chown (see Docker section below).
- The `@payload-config` path alias in `tsconfig.json` is how the app resolves
  `payload.config.ts` — and `tsconfig.json` must exist at runtime for the
  Payload CLI anyway (known Payload bug; see gotchas above).
- `slugify` (src/lib/slugify.ts) implements the Vietnamese diacritic map and is
  the ONLY way slugs are produced; it is unit-tested — extend tests, not just
  the map.
- Heading law (spec §6.4): one `<h1>` per page, rendered from
  `Pages.primaryHeading`; block components start at `<h2>`, never skip levels.
  The Playwright test `heading-discipline.spec.ts` fails the build otherwise.
- **Lexical fixture nodes (Task 20 seeding):** the richtext-lexical feature
  validation (installed dist, `features/lists/shared/validate.js`) requires
  `tag: 'ul'|'ol'` on `list` nodes and a finite `value` (number) on `listitem`
  nodes — the lean paragraph/text shape alone is not enough once lists are
  involved. Seeded fixtures therefore carry
  `{type:'list', version:0, listType, tag, children:[{type:'listitem',
version:0, value:0, indent:0, children:[paragraph…]}]}`. **`listitem.indent` is
  MANDATORY and must be the NUMBER `0` — never the string `'0'`.** `@lexical/list`'s
  `ListItemNode.updateFromJSON` → `ElementNode.updateFromJSON` calls
  `setIndent(serializedNode.indent)`, and `ListItemNode.setIndent` throws
  `Invalid indent value.` unless `typeof indent === 'number'`. Omitting it
  breaks the ADMIN editor (Payload's error boundary replaces the field with
  "Something went wrong") while the PUBLIC site still renders the same lists
  correctly — the HTML/JSX converters never call `setIndent` — which is exactly
  why the M2 gate missed it. Ground truth (2026-10-01), from round-tripping a
  bulleted list through the admin editor and reading the stored JSON back, the
  editor emits e.g. `{type:'listitem', value:1, format:'', indent:0, version:1,
  children:[…], direction:null}` — `indent:0` (a number) is the load-bearing
  part. Also: seeded pages need `_status: 'published'` (drafts are on) or Task
  21's published-only `getPage()` finds nothing, and the Payload DB pool keeps
  tsx scripts alive — call `process.exit()` at the end of seed scripts.
- **Lexical bold = `format: 1`; `bold: true` is silently ignored.** A bold run
  must be serialized as the bitfield `"format": 1` (`NodeFormat.IS_BOLD` in
  `@payloadcms/richtext-lexical/dist/lexical/utils/nodeFormat.js`). Both the
  JSX and HTML text converters
  (`.../converters/lexicalToJSX|lexicalToHtml/.../converters/text.js`) read
  `node.format` and never a `bold` property, so a `"bold": true` node emits
  plain text with no `<strong>` — a silent no-op. Every M2 fixture originally
  carried the inert form and rendered its "bold paragraph" section headings as
  body text; the M3 Task 7 follow-up converted all 14 runs across the 7 M2
  fixtures, plus the 9 `chinh-sach-bao-mat` headings, to `format: 1`. Author
  new fixtures with `"format": 1`, and verify with
  `curl -s http://localhost:3100/<slug>/ | grep -c '<strong>'`.
- No Redis, no worker, no SMTP in this project. When email/notification lands
  (or the AI crawler feature), revisit — that changes §3.9 of the spec.

## Adding a new block (Pages.layout) — the client asked

The "Bố cục" field on a Page is a Payload `blocks` field. **The `blocks` array
in `src/payload/collections/Pages.ts` IS the picker's contents AND its order** —
there is no separate registry to keep in sync, and `Renderer` switches on the
same `blockType` slugs. Changing the order of the array changes the order of the
drawer; removing an entry makes that block unpickable (existing data keeps its
rows but the block type disappears from the add menu).

Where each piece lives:

| piece | file | what it controls |
| --- | --- | --- |
| the picker's list + order | `src/payload/collections/Pages.ts` → `layout.blocks` | imports each block config and lists it |
| a block's NAME, form, thumbnail | `src/payload/blocks/<Name>.ts` | `labels.singular`/`labels.plural` are the visible name; `fields` is the editor form; `admin.images.thumbnail` is the picker thumbnail |
| the public view | `src/components/blocks/views/<Name>View.tsx` | the server component that renders the block |
| the dispatcher | `src/components/blocks/Renderer.tsx` | `switch (block.blockType)` → the view (default → `null`) |
| generated types | `src/payload-types.ts` | written by `pnpm generate:types` |
| DB schema | `src/migrations/*.ts` | written by `pnpm payload migrate:create` |

The block's `slug` (in its config) — **not the file name** — is what `blockType`
stores and what `Renderer` matches.

### Steps to add a NEW block type, in order

1. **Create the block config** — `src/payload/blocks/<Name>.ts`:
   `export const <Name>: Block = { slug: '<slug>', labels: { singular: '…',
   plural: '…' }, admin: { images: { thumbnail: { url:
   '/block-thumbnails/<slug>.svg', alt: '…' } } }, fields: [ … ] }`. Labels are
   Vietnamese (the admin is `vi`).
2. **Register it** — import it and append it to the `layout.blocks` array in
   `src/payload/collections/Pages.ts`. Skipping this is the classic "my block
   never appears" bug: the config can load fine and still not be pickable.
3. **Create the front-end view** — `src/components/blocks/views/<Name>View.tsx`.
   Emit headings through `Heading` (`src/components/blocks/Heading.tsx`); a
   block renders `<h2>`/`<h3>` **only** — never `<h1>` (the page shell owns the
   single `<h1>` from `Pages.primaryHeading`; `heading-discipline.spec.ts` fails
   the build otherwise, spec §6.4).
4. **Add its case to the Renderer** — `src/components/blocks/Renderer.tsx`,
   `case '<slug>': return <Name>View block={block} />`. The `default` branch
   returns `null`, so a block with no case renders **nothing, silently**.
5. **Run `pnpm generate:types`** — regenerates `src/payload-types.ts` so the
   block's fields appear in `Page['layout']` and steps 3–4 typecheck.
6. **Create + run a migration if the block adds DB columns** (it always does if
   it has any `fields`). `push: false` (Task 8b) means **migrations are the only
   way a schema change lands**, in every environment:
   - `pnpm payload migrate:create add_<slug>` → writes
     `src/migrations/<timestamp>_add_<slug>.ts` (the name arg is `args[1]`;
     verified in `payload/dist/bin/migrate.js`)
   - `pnpm payload migrate` against the dev DB. On a pre-`push: false` DB this
     shows the dev-mode "data loss" prompt — answer `y` (documented dev path).
   A blocks field materialises **one table per block slug plus a version
   mirror**: e.g. `formEmbed` created `pages_blocks_form_embed` AND
   `_pages_v_blocks_form_embed` (migration `20261001_105457`). Nested arrays add
   further tables (`pages_blocks_<slug>_<field>`).
7. **Add a thumbnail** (below) — the picker shows a wireframe, not just a name.

Run `pnpm generate:importmap` too **only if** the block introduces a field type
whose admin component is not already in the importMap (the first `richText` did;
`blocks`, `select`, `text`, `array`, `upload`, `relationship` did not — core
field components resolve inside `@payloadcms/ui`).

### Block thumbnails (picker previews) — the convention

The block picker renders each block as a `ThumbnailCard` whose image is a plain
**`<img src alt>` — not `next/image`** (`@payloadcms/ui/dist/fields/Blocks/
BlockSelector/index.js`). The image comes from the block's
`admin.images.thumbnail` (a URL string or `{ url, alt }`); the picker resolves it
as `thumbnailURL = admin?.images?.thumbnail ?? imageURL`. Conventions established
2026-10-01 (the M4 admin-UX pass):

- Files live in `public/block-thumbnails/<slug>.svg` — SVG is crisp at any size,
  tiny, and `public/` ships to the runner (`.dockerignore` does not exclude it).
- **`viewBox="0 0 480 320"` (3:2).** The picker's container is
  `aspect-ratio: 3/2` with `overflow: hidden` and
  `img { width:100%; height:100%; object-fit: cover }`
  (`.../BlockSelector/index.scss`), so a wider image (e.g. 16:9) is **cropped**.
  Match 3:2 or the wireframe loses its edges. The picker renders it ~198×132 CSS.
- One shared palette so the 15 read as a family: frame bg `#F4F5FA`, placeholder
  fill `#E3E6EE`, structural grey `#C4C9D6`, text bars `#B4BAC8`, heading bars
  `#3A3A4A`, and the single brand accent peach `#F29F67` used sparingly for the
  interactive element only (button / active dot / chevron). Corner radius 8,
  stroke 2, **no text** (Vietnamese at that size is illegible).
- Each wireframe shows the block's REAL shape — read the block config **and** its
  view before drawing, because several differ from their name (e.g. `pricingTable`
  renders grouped tables with a fee column, not price cards; `processSteps` is a
  vertical numbered list; `teamGrid` is 2-column cards with a round avatar, not a
  row of circles).

To add one for a new block: create `public/block-thumbnails/<slug>.svg` to that
template and set, on the block config:

```ts
admin: {
  images: {
    thumbnail: { url: '/block-thumbnails/<slug>.svg', alt: '…' },
  },
},
```

The `alt` is Vietnamese and becomes the `<img>` alt. `admin.images.icon` is a
**different slot** — 20×20 square, for the Lexical block menus — do not put the
wireframe there.

**History (do not reintroduce):** `imageURL` / `imageAltText` are the Payload 2
top-level equivalent. The picker still reads them (`?? imageURL`), but 3.90.2
marks both `@deprecated Use admin.images instead`
(`payload/dist/fields/config/types.d.ts`). These 15 blocks carried them briefly
and were moved to `admin.images.thumbnail`; use the `admin.images` form for
anything new.

### The picker's own strings (drawer title + search box)

Two strings in the block drawer are NOT block labels, and both needed a fix
(2026-10-01):

| string | where it comes from | fix |
| --- | --- | --- |
| drawer title `Thêm: …` | `t('fields:addLabel', { label: labels.singular })` in `@payloadcms/ui/dist/fields/Blocks/BlocksDrawer/index.js` — the `labels.singular` of the **blocks FIELD**, not of any block. Payload's sanitizer sets `field.labels = field.labels \|\| formatLabels(field.name)` whenever the field has a `label` (`payload/dist/fields/config/sanitize.js`), so it rendered the English **"Layout"** derived from `Pages.layout`'s field NAME — even though the field's own `label` is `'Bố cục'`. | `Pages.layout` now sets `labels: { singular: 'Bố cục', plural: 'Bố cục' }` explicitly. **No migration** — field `labels` are admin-only; the field name (and thus the DB column) is unchanged. |
| search placeholder | `t('fields:searchForBlock')` in `.../BlockSelector/BlockSearch/index.js`. The `vi` pack ships it half-translated as `'Tìm block'`. | overridden to `'Tìm khối'` in `payload.config.ts`'s `i18n.translations.vi.fields`, beside the existing `block` / `blocks` / `blockType` overrides. |

The two are **independent keys** — `fields.searchForBlock` (the placeholder) vs
`fields.addLabel` + the field's `labels.singular` (the title). The remaining
ASCII-ish `vi` gaps (`authentication.apiKey`, `general.email`, `general.menu`)
are deliberate: they read as normal in Vietnamese software.

## Docker stack (M1, Task 5)

- **Dev must not pay for a production build.** `docker-compose.yml` builds the
  `dev` Dockerfile stage, which is just `FROM deps` (pnpm + full
  `node_modules`, no `pnpm build`). The source tree and `node_modules` are
  compose volume mounts; the compose command runs `CI=true pnpm install && pnpm dev`
  in the container (`CI=true` is required: Docker seeds a fresh named
  `node_modules` volume with the deps image's `node_modules`, pnpm wants to
  purge that copy on first install, and without a TTY it aborts with
  `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`).
  Only `docker-compose.vps.yml` builds the `runner` stage.
- **Build-time env.** `SITE_ENV` and `NEXT_PUBLIC_SERVER_URL` are baked into
  prerendered output (`robots.ts`, metadata) — they are Docker build args,
  not runtime switches. A staging image therefore always serves
  `Disallow: /`; there is no runtime override. The builder fail-fasts on an
  empty `NEXT_PUBLIC_SERVER_URL` (`RUN test -n`) — no silent prod fallback.
- **Secrets at build: none.** `payload.config.ts`'s `PAYLOAD_SECRET` gate
  skips `NEXT_PHASE === 'phase-production-build'`, so `pnpm build` needs no
  secret; `PAYLOAD_SECRET` and `DATABASE_URI` are runtime-only. Compose
  `environment:` blocks must NEVER set `PAYLOAD_SECRET` — it comes from
  `env_file` only, so an unset secret stays unset and the container
  crash-loops loudly instead of running with a placeholder.
- **In-container DB host (deviation from plan text).** `.env`'s `DATABASE_URI`
  targets `127.0.0.1:5432` for host dev, so BOTH compose files override it in
  `environment:` to `postgres://…@db:5432/…`. The plan's dev-compose shape
  omitted the override, but its own Step 5 smoke test (`/api/health` →
  `{"status":"ok"}`) requires in-container DB connectivity.
- **Migrations (spec §11.2) — chosen mechanism: the `migrate` compose
  service.** Next standalone output does NOT trace `src/migrations/` or the
  payload CLI into the runner image, so the runner deliberately contains no
  migrations. Instead both compose files define a one-shot `migrate` service
  (build target `builder`, which has full `node_modules` + the payload CLI)
  gated behind `profiles: ["migrate"]` so it never starts with a plain
  `docker compose up`:
  - dev: `docker compose --profile migrate up migrate`
  - VPS: `docker compose -f docker-compose.vps.yml --profile migrate up migrate`
- **`migrate` service vs dev-pushed DBs (M1 gate finding, 2026-10-01).**
  `pnpm payload migrate` prompts interactively whenever
  `payload_migrations` contains a dev-mode record (`name: "dev"`,
  `batch: -1`, written by every `pnpm dev` schema push):
  "It looks like you've run Payload in dev mode … data loss will occur.
  Would you like to proceed? (y/N)". The one-shot compose service has no
  TTY, so the prompt hangs forever (gate run: hung >10 min until
  SIGINT, then exit 1). The service is only safe against a DB that has
  never been dev-pushed (prod). Never point it at a dev-drifted DB in
  automation; to exercise it locally, use a scratch database.
  _(Historical — since Task 8b `push: false` disables the dev schema push, so
  `pnpm dev` no longer writes the `batch: -1` dev-mode record; this note
  describes DBs that were dev-pushed before that change.)_
- **M2 convention — DB-dependent routes at build time.** No route may hit the
  DB during `next build`. Strategy (a) is the convention: DB-dependent routes
  wrap their fetches in try/catch and render a static fallback that ISR
  replaces on the first runtime revalidation (Task 21 implements this).
  `force-dynamic` (loses ISR) is the fallback if (a) proves unworkable —
  document it here if it ever happens.
- **(a) DID prove unworkable for `/sitemap.xml` — the documented exception
  (Task 15 post-gate fix).** For a PAGE, a baked fallback that ISR later heals
  is acceptable. For a route OUTPUT consumed wholesale by a crawler, it is not:
  the fallback here is an EMPTY `<urlset>`, and ISR leaves a window right after
  every deploy in which the empty file is what gets served — the same defect,
  smaller. So `src/app/sitemap.ts` is `export const dynamic = 'force-dynamic'`:
  DB-less build, correct on the first request, no healing window. Cost is one
  render per crawler fetch (a few per day), and there is no `revalidatePath`/
  `revalidateTag` anywhere in the project, so ISR was never going to be
  immediate anyway. Every OTHER DB-dependent route stays on strategy (a).
- **Applies to layouts and chrome too, not just routes** — the `(frontend)`
  layout's async `getSiteSettings()`/`getNavigation()` (via the chrome
  components) run during prerender, so their fetchers carry the same try/catch
  fallbacks as `getPage`/`getPost` (found in M3 Task 4: an unwrapped layout
  fetch fails the entire `next build` in a DB-less docker build).
- **`data/` is gitignored wholesale** — `data/db`, `data/media`, and any
  future upload contents; there is no committed marker inside it.
- **Media URLs are `/api/media/file/<filename>` in embedded mode** (no
  static `/{slug}` path); robots.txt must keep `Allow: /api/media/` ahead
  of `Disallow: /api/` or Googlebot-Image is blocked.
- **Media URLs carry a trailing slash under `trailingSlash: true` — the
  Media `afterRead` hook strips it (fixed 2026-10-01, post-M2 image bug).**
  `withPayload` reads `nextConfig.trailingSlash` and sets
  `NEXT_TRAILING_SLASH`; Payload's file-URL generation then appends the slash,
  so stored `url`/`sizes.*.url` read `/api/media/file/x.png/`. That URL
  308-redirects to the clean form — browsers cope, **but next/image's
  optimizer does NOT follow redirects** and fails with "The requested
  resource isn't a valid image", breaking every image on the site.
  `src/payload/collections/Media.ts`'s `afterRead` hook normalizes
  `url` + `sizes.*.url` on read, so every consumer (block views, admin
  previews, M3's og:image/JSON-LD) sees the directly-servable URL. Do NOT
  "fix" this by disabling `trailingSlash` (spec §6.7 needs it) or with an
  `images.loader: 'custom'` loader (with a custom loader the built-in
  `/_next/image` endpoint stops serving in this setup — tried and reverted).
- **Media dir ownership on a real Linux host.** The build-time `chown` of
  `/app/data/media` protects named-volume mounts (Dokploy — fine) and is
  irrelevant-but-harmless under Docker Desktop's FUSE bind (fine), but on a
  real Linux host running `docker-compose.vps.yml` as written, dockerd
  auto-creates `./data/media` root-owned and the bind shadows the image dir —
  the `nextjs` user (uid 1001) cannot write, so Payload media uploads fail on
  first use. Before the first `docker-compose.vps.yml up` on a real Linux host
  (the NPM backup path): `mkdir -p data/media && sudo chown 1001:1001 data/media` —
  bind mounts bypass the image's build-time chown; named volumes (Dokploy)
  seed from the image and preserve it. `./data/db` is immune (the Postgres
  entrypoint chowns its own data dir).
- **`stop_grace_period: 60s` on every service** in both compose files —
  Docker Desktop defaults StopTimeout to 1 s, and a plain `docker stop`
  would SIGKILL a container still serving a response (workspace rule 12).

## Token matrix decision (spec §5.5)

- Decision: dedicated TokenMatrix block (the spec §5.5 contingency), NOT the
  existing pricingTable.
- Why: every raw row carries three fee columns (Token / Dịch vụ / Duy trì)
  plus a computed total (Tổng₫) per term — 4 values spanning fee types per
  row, one of them a total — which the three-field (service, term?, fee) row
  cannot carry without mangling; the 15 structures × 7 provider tabs also
  vary in term count (NCCA has a 4-năm group) that a fixed column mode
  cannot express.
- Checked against seed/raw/chu-ky-so-token.html on 2026-10-01.
- Migration: `src/migrations/20261001_081342.ts` (run after the running dev
  server had already dev-pushed the tables — dropped the dev-pushed
  `*token_matrix*` tables first, then `echo y | pnpm payload migrate`
  applied and recorded the migration cleanly; see the dev-mode prompt note
  under "migrate service" in the Docker section).

## M2 gate findings (Task 24, 2026-10-01)

- **`seed.ts` now provisions the whole stack, not just pages.** A wiped DB
  previously lost the admin user, the 2 Authors, the news category and BOTH
  globals (all hand-created in the admin). Task 24 extended `scripts/seed.ts`
  with idempotent upserts that run BEFORE the page loop (teamGrid resolves
  author slugs): the admin user (only when `users` is empty, password from
  `DEV_ADMIN_PASSWORD` in .env — gitignored), Authors by slug, Category by
  slug, and the Navigation + SiteSettings globals. Re-running over a populated
  DB creates no duplicates; the 9 pages follow.
- **The dev DB is a BIND MOUNT — `docker compose down -v` does NOT wipe it.**
  Clean state = `rm -rf ./data/db` (RELATIVE path only, from the project root —
  the Git Bash path-mangling memory forbids absolute-path `rm`), then
  `docker compose up -d db`.
- **`_media-map.json` holds media ids valid only for the DB that created
  them.** After a wipe, delete the map and re-run `pnpm seed:media` so the 13
  images re-upload and the map is regenerated before `pnpm seed`.
- **Fresh-DB `pnpm payload migrate` is non-interactive** — a never-dev-pushed
  DB has no `batch: -1` record, so there is no "data loss" prompt. Gate run:
  all 6 migrations applied cleanly with no `y` pipe.
- **`Pages.layout` registers 14 blocks, not 13.** The spec §5.5 / Task 14
  figure of "13 attorneyshere-pattern blocks" predates the Task 23
  `TokenMatrix` addition (and Hero + HeroCarousel are two distinct blocks).
  The admin create-view check verified all 14 labels.
- **Admin-in-Vietnamese is programmatic-verifiable** (spec §5.7, criterion 6):
  REST-login (`POST /api/users/login`), fetch `/admin` and
  `/admin/collections/pages/create` with the `payload-token` cookie, and assert
  the Vietnamese strings are present in the served HTML/RSC payload. The nav
  labels are the collection/global `labels.plural`; the block labels are the
  block `labels`.

## UI notes — hero ratio & site logo (2026-10-01)

- **Hero/banner ratio comes from the media doc's `width`/`height`.** In
  pure-banner mode (`heroCarousel` with `showOverlay: false`, the legacy
  banners-as-design case) `HeroCarousel` sets the section's inline
  `aspect-ratio` from the ACTIVE slide's media dimensions; `object-cover` on a
  container whose ratio matches the image is an exact fill, so nothing is
  cropped. `aspect-[8/3]` (2.667:1, the real banner ratio) is only the fallback
  when dims are missing; all three homepage banners are 2048×768 (or
  1024×384), so slide swaps are CLS-neutral (measured 0 at 1440 and 375). The
  `overlay` hero (`showOverlay: true`) and the single-image `hero` block
  (`HeroView`) keep the fixed `aspect-[21/9] min-h-[320px]` + `object-cover` —
  there the image is a background under our own text, so cropping is by design.
  `Renderer`'s `heroCarousel` mapping passes `width`/`height` through from the
  Payload Media doc.
- **The site logo is an SVG served via a plain `<img>`**, not `next/image`:
  Next's image optimizer rejects SVG unless `dangerouslyAllowSVG` is enabled
  globally — a security toggle we deliberately did NOT flip for one asset — and
  a vector logo needs no resizing. `Header` links the logo to `/` with
  `aria-label`/`alt` = `brandName` and sizes it `h-12 w-auto`, falling back to
  the plain-text brand link when `SiteSettings.logo` is empty.
- **The logo is part of the seed pipeline.** `scripts/seed-assets.ts` exports
  the fixed `EXTRA_ASSETS` list (the logo source URL + alt `'Luật Gia Trí'`);
  `scripts/seed-media.ts` merges it into the fixture-scan refs so `seed:media`
  uploads it (as an SVG, `sharp` stores it with NO `imageSizes` — expected), and
  `scripts/seed.ts` sets `SiteSettings.logo` from the mapped id. A fresh DB
  therefore reproduces the header logo with no manual admin step; the firm can
  still replace it in the admin (Thông tin website → Logo).

## Top bar — search box + dropped social links (2026-10-02)

- **The search box lives in the top bar** (`src/components/chrome/TopBar.tsx`),
  right-aligned; it was removed from `Header`. The top bar's social links were
  removed too — the same `SiteSettings.socials` values still feed
  `FloatingContact` (`(frontend)/layout.tsx`) and the JSON-LD `sameAs`
  (`src/lib/jsonld.ts`), so nothing is orphaned.
- **`src/components/SearchBox.tsx` is layout-agnostic by design** — it renders
  only the form's own flex row; the CALLER supplies placement via its
  `className` prop. Keep positioning (centering, right-aligning) OUT of the
  component; a hardcoded `mx-auto max-w-md` is what kept it out of the top bar.
- **Narrow screens (≤375px):** the long email is `hidden` below `sm` (still in
  the footer and on `/lien-he/`); the hotline stays `shrink-0` and the search
  form absorbs the remaining width. One row, no overflow. Bar height 32 → 36px.
  The input is 16px on mobile (`max-sm:text-base`) to suppress iOS focus zoom.

## Admin theming — brand palette + dashboard polish (2026-10-01)

`src/app/(payload)/custom.scss` is the ONLY admin stylesheet other than
`@payloadcms/next/css` (imported by `src/app/(payload)/layout.tsx`). It has two
layers, and only the second one is upgrade-fragile.

### 1. The token layer (upgrade-proof) — already in the file

How the admin gets its colours, verified against the compiled admin bundle:

```
@payloadcms/next/dist/prod/styles.css  (the served admin CSS)
  :root                 { --color-base-N: … ; --color-success-N: … ; … }
  :root                 { --theme-elevation-N: var(--color-base-N) }        ← light
  html[data-theme=dark] { --theme-elevation-N: <explicit remap> }           ← dark
  :root                 { --theme-bg: var(--theme-elevation-0)
                          --theme-input-bg: var(--theme-elevation-0)
                          --theme-text: var(--theme-elevation-800)
                          --theme-border-color: var(--theme-elevation-150) }
```

- **Light is a straight alias** (`--theme-elevation-N` → `--color-base-N`).
- **Dark is an explicit hand-written remap, NOT a mirror.** Measured
  (`@payloadcms/ui/dist/scss/colors.scss`): `0→900, 50→850, 100→800, 150→750,
  200→700, 250→650, 300→600, 350→550, 400→450, 450→400, 550→350, 600→300,
  650→250, 700→200, 750→150, 800→100, 850→50, 900→0, 950→0, 1000→0`. There is
  **no `--theme-elevation-500` remap**, so 500 is the fixed pivot. Consequence:
  in dark the canvas (`--theme-bg` = elevation-0) is `--color-base-900` —
  i.e. **the dark admin canvas is the brand navy `#1e1e2c`**.
- **The success / warning / error families are ALSO reversed in dark**
  (`--theme-success-100` → `--color-success-900`). Any status colour that must
  look right in both themes has to be written with `--theme-*`, not with a raw
  `--color-*` stop.
- **Cascade:** `custom.scss` is unlayered and imported after
  `@payloadcms/next/css`. Unlayered declarations beat layered ones at the same
  origin, and that comparison happens BEFORE specificity — so a plain `:root`
  / `html[data-theme='light']` rule in custom.scss overrides Payload's
  `@layer payload-default` `html[data-theme=…]` rules with **no `!important`**.
  Same mechanism the `--font-serif` fix uses.
- The `--color-*` runs are OKLCH-generated brand ramps, pinned so each client
  hex sits at the matching-lightness stop (peach→300, teal→400, gold→300,
  blue→450, navy→base-900). Treat them as frozen.
- **`--color-blue-*` is defined but UNCONSUMED** — nothing in custom.scss and
  nothing in Payload's own admin CSS references it today. It stays: the client
  supplied blue as a supporting colour and the ramp is part of the frozen token
  layer. It is not dead code to be deleted, and it is not a bug that it does not
  paint anything yet.

### 2. The canvas / card contrast — the inversion nobody expects

Payload's light theme paints `--theme-bg` (the canvas: `.template-default`,
`.template-default__wrap`) **white** and paints `.card` with
`background: var(--theme-elevation-50)` — light grey. Default Payload is
therefore GREY CARDS ON A WHITE CANVAS: the exact inverse of the
StarAdmin-style reference in `docs/admin-template.png`. Evidence
(`@payloadcms/next/dist/prod/styles.css`):

```
.template-default { background-color: var(--theme-bg) }   /* = elevation-0 = #fff */
.card { background: var(--theme-elevation-50); … }        /* = #f4f5fa */
```

Fix (light theme only):

```scss
html[data-theme='light'] { --theme-bg: var(--color-base-50); }   /* canvas → grey */
html[data-theme='light'] .card { background: var(--theme-elevation-0); }  /* cards → white */
```

Dark mode already separates correctly (cards at elevation-50 = `--color-base-850`
sit above the elevation-0 canvas) and is deliberately left alone.

### 3. The component layer (FRAGILE — depends on Payload internals)

The rest of custom.scss targets Payload 3.90.2's PRIVATE admin class names.
They are not API; a Payload bump can rename them and the rules silently stop
applying (the admin keeps working, it just reverts to the stock look).
Class names were read off the live admin DOM + `prod/styles.css`; re-verify
against the served DOM after any Payload upgrade. What is overridden and why:

| selector | why |
| --- | --- |
| `:root` `--style-radius-s/m/l` = 8/8/12px | every `.field-type.* input` and `.btn` hardcodes `border-radius: var(--style-radius-s)`; `.card`/`.collapsible` use `-m`. One lever, soft corners everywhere. |
| `html[data-theme='light'] .nav` → white | reference has a white rail beside a grey canvas; `.nav` is otherwise transparent over `--theme-bg`. |
| `.nav-group__label` uppercase + letterspaced + `--theme-elevation-600` | section labels. Stock uses elevation-500, which measures ≈4.78:1 on the rail's own rail colour in DARK (just under 4.5:1) — 600 clears 4.5:1 in all four cases (light rail 5.85:1, grey canvas 5.37:1, dark rail 8.00:1, dark hover 7.73:1) with no light-mode regression. |
| `.nav__link` → 8px pill, `padding: 7px 12px`, `margin-block: 4px` (ELEMENT-AGNOSTIC — no `a` in the selector); `:hover` scoped `a.nav__link:not(:has(.nav__link-indicator))` → `--theme-elevation-100` | the stock link is `padding-inline-end: 30px` with no start padding, so a background would be lopsided; stock also underlines on hover. The `margin-block` is the client's "more space between items": it collapses between siblings, so the measured row pitch goes 34px → 38px and the pill gaps are actually visible. **The `a` had to be dropped:** 3.90.2 renders the CURRENT page as `<div class="nav__link">` (a plain `div`, only other pages get `<Link>`→`a`), so an `a.nav__link` selector skipped exactly the one row that needs the pill geometry — its text stayed 30px off. The `:not(:has(...))` on the hover rule is equally load-bearing: `a.nav__link:hover` (0,3,1) would out-rank `.nav__link:has(…)` (0,2,0) and repaint the active pill on hover. |
| `.nav__link::before` → 18px icon slot, `margin-inline-end: 10px` | one pseudo-element per row, keyed to a per-item `--admin-nav-icon`. See §3b below. |
| `.nav__link:has(.nav__link-indicator)` → peach pill | **the active nav item is marked by the presence of a `.nav__link-indicator` child, not an `.active` class** — 3.90.2 renders `a.nav__link` with a `<div class="nav__link-indicator">` inside. The 2px bar is hidden and the whole link becomes the peach pill (`--color-peach-100` / `-700`, fixed stops on purpose so the pill reads on both rails). |
| `html[data-theme='light'] .btn--style-primary:not(.btn--disabled)` → navy | stock is `--theme-elevation-800` = `#2f2f32` (near-black grey), not the brand navy. Dark keeps Payload's inverted (light chip + dark text) button. |
| `.btn--style-secondary:not(.btn--disabled)`, `.btn--style-pill:not(.btn--disabled)` → hairline `--theme-elevation-200` outline | stock secondary uses a full-strength elevation-800 border; `.btn--style-pill` ("Tạo mới"…) is a solid base-150 block. |
| **`:not(.btn--disabled)` on all four button overrides** | Load-bearing, not decoration. Payload's `.btn` drives its whole state machine through custom properties (`.btn { color: var(--color); background-color: var(--bg-color) }`, `.btn--style-primary { --bg-color: …800 }`, `.btn--style-primary.btn--disabled { --bg-color: …200; --color: …800 }`). A plain `html[data-theme='light'] .btn--style-primary { --bg-color: navy }` therefore wins the cascade over the `.btn--disabled` block and the disabled state NEVER APPLIES — a disabled Publish / Save-draft looks fully enabled. Gating on `:not(.btn--disabled)` lets the disabled values through untouched. Do NOT re-declare the disabled values here (that would re-create the same trap from the other side); do NOT reach for `!important`. Modifier name verified in `@payloadcms/ui` `Button/index.js`: `disabled && \`${baseClass}--disabled\``. |
| `html[data-theme='light'] .collection-list .table` → white card | the list table sits directly on the canvas. `.collection-list .table` deliberately bleeds (`width: calc(100% + var(--gutter-h)*2)`, `left: calc(var(--gutter-h)*-1)`, `padding-left: var(--gutter-h)`) — zeroing only `padding-left` turns the bleed into the card's own edges. |
| `.table tbody tr:nth-child(odd)` → transparent; `.table tbody td` → `border-bottom: 1px solid --theme-elevation-150`; `tr:hover` → elevation-50; `thead` → elevation-50 + uppercase 11px/600 `--theme-elevation-600` (same contrast reasoning as `.nav-group__label` above: 500 dips to ≈4.78:1 in dark; 600 clears 4.5:1 in all four light/dark × tinted/plain combinations) | stock is a full-bleed zebra with no hover and no separators, which on the new grey canvas reads as grey-on-grey stripes. Borders go on the `td` so it works regardless of `border-collapse`. |
| `.pill--style-light` → white outlined chip, 8px | the neutral control chip ("Hiển thị cột", "Bộ lọc", version tags) is a solid base-150 block by default. |
| `.pill--style-success` / `--warning` → `--theme-success-100` / `--theme-warning-100` fill + `-800` text, `border-radius: 999px` | the brief's status-pill pattern (light theme: teal-100/teal-800 = 8.94:1; dark resolves to teal-900/teal-200 = 9.55:1 via the family reversal). |
| `html[data-theme='light'] .collapsible`, `… .document-fields__edit` → white | each layout BLOCK / array row and the document form column are transparent by default, so they would be grey boxes floating on the grey canvas. |
| `.field-type input…`, `.field-type textarea`, `.react-select .rs__control` → border `--theme-elevation-200` | radius arrives from `--style-radius-s`; focus styling (the teal ring) is deliberately NOT touched. |
| `.login__*` | `.login__form` becomes the white card (light) / elevation-50 card (dark); the login CTA is peach (`--color-peach-300` + navy text) while every other primary button stays navy, and it carries the same `:not(.btn--disabled)` guard as the other primaries. |
| `.admin-brand` plate + `payload.config.ts` `admin.components.graphics.Logo` | The brand mark is NOT a CSS hack any more. It is registered as `admin.components.graphics.Logo: '@/components/admin/AdminBrand#AdminBrand'` — the PUBLIC hook (Payload's `elements/Logo/index.js` does `RenderServerComponent({ Component: CustomLogo, Fallback: PayloadLogo })`) — and `AdminBrand.tsx` renders `<img src="/icon.svg">` on a light rounded plate (`.admin-brand`: white `--color-base-0`, `--color-base-150` hairline, `--admin-shadow-card`). **Why a plate:** the monogram is brand navy `#002147` + gold; navy measures 1.02:1 against the dark canvas, so on the dark login only the gold fragment was visible. On the plate navy is 16.05:1 in BOTH themes. The earlier `.login__brand .graphic-logo { display: none }` + `::before { background: url('/icon.svg') }` hack was removed. Runs `pnpm generate:importmap` (its entry is in `src/app/(payload)/admin/importMap.js`). |
| `.template-minimal { background-color: var(--theme-bg) }` | Partly an upstream Payload bug: `.template-minimal` (the login/logout/verify shell) references `--theme-bg-color`, which 3.90.2 **never defines** (one occurrence in the compiled CSS — a usage, no declaration). Declaring it makes the shell's background explicit and deterministic. NOTE: the reviewer's report of a near-black dark login was NOT reproducible — `html { background: var(--theme-bg) }` is present in the compiled CSS, so the dark canvas was already `rgb(30,30,44)`. This rule is belt-and-braces, not the fix for an invisible brand mark. |
| `.btn--size-*` / `.react-select .rs__control` / `.rs__option` / `.popup-button-list__button` → shadcn control scale | See §3c below. Buttons 32–34 → 36px, 13 → 14px text; dropdown panels 27 → 36px rows and 35 → 40px options. |

### 3b. Sidebar icons — keyed on `#nav-<slug>`, painted with `mask-image`

Client request (2026-10-01): an icon per menu item, plus more room between
items. Payload 3.90.2 has **no per-collection icon config** —
`elements/Nav/index.client.js` builds only `href` + `id` and emits
`.nav__link` / `.nav__link-indicator` / `.nav__link-label`. The icons are
therefore pure CSS, in custom.scss §2b.

**The hook is the `id`, NOT the `href`:**

```
if (type === collection) { href = `/admin/collections/${slug}`; id = `nav-${slug}` }
if (type === global)     { href = `/admin/globals/${slug}`;     id = `nav-global-${slug}` }
isActive ? <div  class="nav__link" id={id}>          ← the CURRENT page: NO href
         : <Link class="nav__link" id={id} href={href}>
```

**Warning: the active row is a `<div>` with no `href`.** Any `a[href="…"]`
icon rule silently loses the icon on exactly the row the user is looking at.
The `id` is on both branches. Verified live: on `/admin/collections/pages/`
the active `#nav-pages` is a `div` and still renders its own icon.

**`mask-image` + `background-color: currentColor`, NOT `background-image`.**
A data-URI SVG used as `background-image` cannot see `currentColor`, so it
would need a hard-coloured copy per state per icon (4×). As an alpha mask over
`currentColor`, one definition covers normal / hover / the peach active pill /
dark mode with no extra rules. Measured: the icon's computed
`background-color` is `rgb(30,30,44)` on a normal light row, `rgb(255,255,255)`
on a normal dark row, and `rgb(114,72,44)` (`--color-peach-700`) on the active
peach pill in BOTH themes — it always equals the row's own text colour.

Details that matter:

- The slot lives on `.nav__link::before`, not on `.nav__link-label`.
  `.nav__link` is `display: flex; align-items: center`, so the pseudo-element is
  a real flex item centred by the same rule as the label, and it exists on BOTH
  the `<a>` and the active `<div>` branch. `.nav__link-label` has **no CSS at
  all** in 3.90.2 (0 hits in `dist/prod/styles.css`), so there is no ellipsis to
  preserve — but the flex-item route is still the safer one because it never
  joins the label's inline line box.
- **Graceful degradation:** the base rule defaults
  `--admin-nav-icon: linear-gradient(#0000, #0000)` — a fully transparent mask
  that keeps the 18px slot empty. A future collection with no rule renders
  iconless **without** shifting the label alignment of any other row. To add
  one: `#nav-<slug>::before { --admin-nav-icon: url("data:image/svg+xml,…"); }`.
- Shapes are lucide (`https://lucide.dev`, MIT) — `users`, `image`, `pencil`,
  `folder`, `tag`, `file-text`, `arrow-right-left`, `inbox`, `layers`,
  `settings`, `list` — copied verbatim into data URIs (24×24 viewBox,
  `stroke-width: 2`, scaled into an 18px box ⇒ 1.5px rendered stroke).
- Spaces inside the data URIs are **percent-encoded (`%20`)**. The first
  revision used literal spaces, which Chromium tolerated but is not portable;
  `url("data:image/svg+xml,%3Csvg%20xmlns=…")` is the safe form. Verified after
  the swap: 11/11 icons still render and no computed `mask-image` contains a
  raw space.
- Spacing: `margin-block: 4px` on `.nav__link`; the label offset moves 32px →
  a uniform **60px** on every row (nav inline padding 20 + link padding 12 +
  icon 18 + gap 10). Row pitch 38px; the last collection → first global gap is
  73px, which is the pre-existing `.nav-group { margin-bottom: 10px }` break.
- **There is no icon-rail "collapsed" mode in 3.90.2.** The only collapsed state
  is the off-canvas mobile drawer: `NavWrapper` renders
  `<aside class="nav" inert={!navOpen}>`, and while closed the aside is
  `opacity: 0` + `inert` at `width: 100vw`. Nothing is ever left stranded and no
  label is hidden while the nav is visible. Verified at a 700px viewport, closed
  and open.

### 3c. Control scale — shadcn-sized buttons and dropdowns (2026-10-01)

Client ask: "the style for buttons and dropdowns, I need it bigger … follow the
default UI from shadcn". custom.scss §3c.

**The root-size trap is real and is why this is written in px, not rem.**
shadcn's scale (`h-9` = 2.25rem, `px-4` = 1rem, `text-sm` = 0.875rem) assumes a
**16px root**. Payload's admin sets `--base-body-size: 13`; `<html>` and
`<body>` both computed **13px**. `0.875rem` here would be **11.4px** — smaller
than the stock 13px button text, the exact opposite of the ask. shadcn's *shapes*
were followed; its rem *numbers* were converted to px against the real root.

Measured before → after (computed, light, on a served 3100 build):

| control | height | padding | font-size |
| --- | --- | --- | --- |
| `.btn--size-medium` (Publish/Save draft/doc tabs) | 32–34 → **36px** | 4px 12px → **6px 16px** | 13 → **14px** (weight 400 → 500) |
| `.btn--size-small` (pill actions, upload "Tạo mới") | 24 → **32px** | 0 8px → **4px 12px** | 13 → **14px** |
| `.btn--size-large` (unused today) | — → **40px** | — → **8px 20px** | — → 15px |
| `.field-type input` / `textarea` | **40px — UNCHANGED** | unchanged | 13 → **14px** (§5e) |
| `.react-select .rs__control` (trigger) | 40 → **40px** (unchanged height) | 7px 12px → **7px 14px** | 13 → **14px** |
| `.rs__option` (select option row) | 35 → **40px** | 7.5px 15px → **10px 15px** | 13 → **14px** |
| `.popup-button-list__button` (menu row) | 27 → **36px** | 3.5px 10px → **8px 14px** | 13 → **14px** |
| `.popup__content` (panel) | — | 10px → **12px**, radius 4 → **8px** | — |
| `.list-controls__toggle-*` (dropdown-trigger chips) | 26 → **32px** | 0 8px → **0 12px** | 13px |

Decisions worth recording:

- **Inputs were NOT shrunk.** They already measured 40px, i.e. at/above the
  shadcn `h-9` scale; the real gap was everything else being 24–34px. The select
  trigger was likewise already 40px, so it is **pinned to the input height
  rather than inflated** — a 44px trigger next to a 40px input read as
  inflated, and "a form row reads as one control height" is the goal the client
  actually sees.
- **`:not(.btn--icon-only)`** keeps the 24×24 icon-only action buttons (upload
  edit/remove, relationship popups) out of the rescale — a 36px hit area would
  wreck the rows they sit in.
- The button size classes are Payload's own (`Button/index.js` appends
  `--size-${size}`); the rules re-state the `--btn-padding-*` / `--btn-icon-*`
  tokens Payload consumes instead of hard-overriding its computed padding, so
  Payload's own icon/padding relationship stays intact.
- The `:not(.btn--disabled)` guards (§3) are untouched and were re-verified —
  see §5d.

### 4. Admin favicon / Open Graph (`payload.config.ts`)

`admin.meta` is spread into `@payloadcms/next`'s `generateMetadata()`
(`dist/utilities/meta.js`), where `icons` **replaces** the default favicon pair:
`const icons = incomingMetadata.icons || [payloadFaviconDark, payloadFaviconLight]`.
`payload.config.ts` therefore sets
`icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' }]` — the served
admin HTML now carries `<link rel="icon" href="/icon.svg" type="image/svg+xml"/>`
and no `payload-favicon-*`. `generateMetadata` also sets `metadataBase` from
`config.serverURL`, so the root-relative URL resolves absolutely.
Do NOT set `admin.meta.description` — the per-view metadata already supplies a
Vietnamese description and `admin.meta` is spread AFTER it, so it would
override every admin page with one static string.

### 5. How this was verified (2026-10-01)

- Item 1: on `<html>`, `--color-base-900` → `rgb(30, 30, 44)`, `--color-base-50`
  → `rgb(244, 245, 250)` (dev :3000, computed).
- Screenshots (untracked) in `docs/admin-shots/` — login, dashboard light,
  collection list, document edit, dashboard dark, editor Vietnamese, collection
  list dark — captured against a real `pnpm build && next start -p 3100`.
- Console: **zero** errors/warnings on login, dashboard (both themes), list,
  edit and while typing into the rich-text editor.
- Vietnamese: `.editor-container` / `.ContentEditable__root` still compute
  `font-family: "Times New Roman", "Liberation Serif", …` (the §--font-serif
  fix is untouched). Verified with pre-composed input
  (`ă`=U+0103, `ế`=U+1EBF, `ệ`=U+1EC7, `ữ`=U+1EEF, `ợ`=U+1EE3 …) typed live
  into the editor.

### 5b. Re-verification after the CSS review (2026-10-01)

The review's three must-fixes all landed; re-verified against a fresh
`pnpm build && next start -p 3100` (not dev).

- **Disabled buttons (computed, light).** Default state of a doc with no unsaved
  changes: primary Publish/Save `--bg-color` → `#cfcfd9`, `--color` → `#2f2f32`,
  computed `background-color: rgb(207, 207, 217)` / `color: rgb(47, 47, 50)`;
  secondary (Save draft) `color`/`border-color: rgb(207, 207, 217)`. After typing
  into `#field-title` (dirty form): primary `--bg-color` → `#1e1e2c`,
  `--color` → `#fff`, computed `background-color: rgb(30, 30, 44)`; secondary
  `color: rgb(30, 30, 44)`. Dark disabled: primary `rgb(73, 73, 80)` on
  `rgb(234, 234, 241)`. The two states are visually distinct
  (`13-disabled-buttons-light.png` vs `13b-buttons-enabled-light.png`).
- **Nav alignment.** All 11 `.nav__link` rows report the same `labelLeft: 32`
  (distinct set `[32]`), box 20→254, `padding: 12px/12px`, `border-radius: 8px`;
  the current-page row (a `<div>`) gets the identical peach pill. Both themes
  (`11-nav-active-light.png`, `11-nav-active-dark.png`).
- **Dark login.** `.template-minimal` and `html` both compute
  `rgb(30, 30, 44)`; the plate is `rgb(255, 255, 255)` with a
  `1px rgb(220, 220, 229)` border and `.graphic-logo` is gone
  (`12-login-dark.png`).
- **Console:** 0 errors / 0 warnings on the served login and edit views.
- **Known anomaly (not over-claimed):** toggling `btn--disabled` on the
  "Tạo mới" pill by hand in the DOM flips its `--bg-color` (`#fff` →
  `#dcdce5`, proving the `:not()` gate works) but the computed
  `background-color` stayed `rgb(255,255,255)` in that synthetic mutation. The
  real Publish / Save-draft buttons track `--bg-color` correctly, so the defect
  is genuinely fixed; the pill case is unexplained and is recorded rather than
  asserted.

### 5c. Re-verification after the nav icons / spacing (2026-10-01)

Against a fresh `pnpm build && pnpm exec next start -p 3100`:

- 11/11 rows render an icon; every `.nav__link`'s `::before` resolves
  `mask-image` to a `url("data:image/svg+xml,…")`.
- **Active-row proof:** on `/admin/collections/pages/` the active `#nav-pages`
  is a `<div>` (no href) and its icon IS present, with
  `background-color: rgb(114,72,44)` — vs `rgb(30,30,44)` on a normal light row
  and `rgb(255,255,255)` on a normal dark row. The icon follows the row colour,
  it is not hard-coded.
- Alignment invariant: `labelLeft` is a single value across all 11 rows — 60px
  on desktop (both themes, list and edit views), 56px in the 700px drawer.
- Spacing: row height 34px, pitch 38px (was 34px), group break 73px.
- Console: 0 errors / 0 warnings on the list and edit views.
- Screenshots (untracked): `14-nav-icons-light.png`, `15-nav-icons-dark.png`,
  `16-nav-active-icon.png`, `17-nav-collapsed.png`.

### 5d. Re-verification after the control rescale + data-URI encoding (2026-10-01)

Against a fresh `pnpm build && pnpm exec next start -p 3100`:

- **Disabled buttons still work** (the §3 `:not(.btn--disabled)` guards survived
  the taller boxes). No unsaved changes: primary Publish `--bg-color` `#cfcfd9`,
  `--color` `#2f2f32`, computed `background-color: rgb(207,207,217)` /
  `color: rgb(47,47,50)`; secondary `color`/`border-color: rgb(207,207,217)`.
  After typing into `#field-title`: primary `--bg-color` `#1e1e2c` / `--color`
  `#fff`, computed `rgb(30,30,44)`; secondary `color: rgb(30,30,44)`,
  border `rgb(207,207,217)`. Byte-identical to the pre-rescale values.
- **Nav invariant intact:** 11/11 icons, uniform `labelLeft` 60px, row pitch
  `[38, 73]`, active `#nav-pages` still a `<div>` rendering its own icon in
  `rgb(114,72,44)`.
- **Data URIs percent-encoded** and re-verified: **no** computed `mask-image`
  contains a raw space, and all 11 icons still render.
- **No layout damage from the taller controls:** `.doc-controls` stays 56px with
  a 36px `.doc-controls__controls` on one line; `.list-controls` 52px, no
  scroll overflow (`scrollWidth === clientWidth`); the list `.table` no overflow.
- Console: 0 errors / 0 warnings on the list and edit views.
- Screenshots (untracked): `18-buttons-light.png`, `19-buttons-dark.png`,
  `20-dropdown-open.png`, `21-edit-actionbar.png`.

### 5e. Form-row type unification (2026-10-01)

Follow-up to §3c: the buttons and dropdowns moved to 14px while the inputs
stayed 13px, so a form row mixed two type sizes. shadcn sets inputs and buttons
to the same `text-sm`, so `.field-type input` / `.field-type textarea` now
inherit the same 14px — via the same `:not([type='checkbox']):not([type='radio']):not([type='submit'])`
guard as the §6 border rule, so the 22×22 checkbox squares keep the browser
default and nothing else moves.

- **Height and padding untouched** — inputs still 40px, textarea still 60px.
- Computed after the change: `.field-type input` **14px / 40px**,
  `.field-type textarea` **14px / 60px**, `.btn--size-medium` **14px**,
  `.react-select .rs__control` **14px**, `.rs__input` **14px**.
- **One control deliberately stays 13px:** the list-view search box
  (`.search-filter__input`, `#search-filter-input`). It is not a `.field-type`
  and it is not in a form row — its neighbours are the 13px
  `.list-controls__toggle-*` chips, so bumping only the box would create the
  mismatch it was meant to remove.
- **No clipping introduced.** Every `.field-type input`/`textarea` was probed
  for `scrollWidth > clientWidth` / `scrollHeight > clientHeight`: clean. The
  two `.field-type` *containers* that do report overflow (`blocks-field` 788/771,
  `relationship` 767/729) are **pre-existing** — an A/B re-measure with the font
  forced back to 13px returned byte-identical numbers, so the type change is not
  the cause.
- Disabled-button values re-checked and unchanged; nav invariant intact
  (11 icons, uniform 60px label offset, active `#nav-pages` `<div>` still
  iconned in `rgb(114,72,44)`); 0 console errors.
- Screenshots (untracked): `22-edit-form-light.png`, `23-list-light.png`,
  `24-edit-form-dark.png`.

### 6. PRE-EXISTING BUG found while verifying (NOT caused by the theming) — FIXED

**`Error: Invalid indent value.` broke the rich-text editor on the seeded
pages.** `@lexical/list`'s `ListItemNode.updateFromJSON` feeds the stored
`indent` to `setIndent()`, which throws unless it is a **number**; the
hand-authored seed fixtures (Task 20) wrote `listitem` nodes as
`{type, value, version, children}` with no `indent` at all, and the DB rows
mirrored them. Fixed 2026-10-01: `indent: 0` (the NUMBER — an earlier version
of this note wrongly said the string `'0'`) was added to all **50** `listitem`
nodes across the four affected fixtures, and backfilled into **all four DB
tables** — the live content tables AND their `_pages_v_*` version mirrors — by
the idempotent `scripts/fix-lexical-indent.ts` (`pnpm fix:lexical-indent`,
which only rewrites rows whose listitems lack a numeric `indent`). Affected
fixtures/rows: `chinh-sach-bao-mat` (11), `chu-ky-so-token` (7),
`dich-vu-ke-toan` (27), `thanh-lap-doanh-nghiep-tron-goi` (5).

**Mount nuance (measured 2026-10-01 against a `next start` build):** in the
page edit view only `richText` BLOCK bodies mount a Lexical editor — the
`faq` `items[].answer` rich-text fields are stored in the RSC payload but their
editor does not render (the answer label is never in the visible DOM; toggling
every collapsible/array-row control, incl. the array's own "Hiển thị toàn bộ",
did not mount it). So the FAQ nodes never actually crashed the edit view; the
real edit-view crash was `chinh-sach-bao-mat` and `dich-vu-ke-toan` via their
richText block bodies — reproduced by re-stripping `indent` (the prod build
then throws the minified `Minified Lexical error #117`) and confirmed gone once
it is restored. The FAQ rows were patched anyway (and the fixtures fixed) so
any path that does parse them — a version restore, or a future UI that mounts
the field — stays clean. The front end was never affected either way (the
converters ignore `indent`).

### 7. Not done / deliberately skipped

- `.document-fields__sidebar-wrap` (the right-hand Slug/meta column) is left on
  the canvas rather than carded — it holds single fields and carding it made the
  form look like two competing sheets.

## UI notes — favicon & admin fonts (2026-10-01)

- **Favicon = `src/app/icon.svg`** (Next file convention → `<link rel="icon">`
  on every `(frontend)` route). It is a committed static asset derived from
  `data/media/Gia-Tri-Law-logo.svg`, NOT the seeded media doc, so the tab icon
  never depends on the media DB or the domain. It frames the logo's **GT
  monogram** (`<g id="brand-mark">`, copied byte-identical) in a square
  transparent `viewBox`: the wordmark + tagline are illegible at 16px, and a
  brand-navy plate would hide the navy `#002147` half of the monogram. `/admin`
  served Payload's own default favicon until 2026-10-01 — the site icon does
  not reach it automatically (Payload's `RootLayout` renders its own `<html>`);
  it is now set explicitly via `admin.meta.icons` in `payload.config.ts` (see
  "Admin theming" §4 above).
- **The admin rich-text editor renders with `--font-serif`, and that stack
  started with Georgia — which has no Vietnamese glyphs.** Payload styles
  `.rich-text-lexical .editor-container` (and the version-diff view) with
  `font-family: var(--font-serif)`, and the stock serif list begins with
  Georgia. Georgia has no Vietnamese glyphs, so the browser substitutes every
  accented Vietnamese letter per character and the editor text renders in two
  mismatched faces with detached tone marks (the acute on Bắt floats off to the
  right of the ă). `src/app/(payload)/custom.scss` overrides `--font-serif`
  with a Vietnamese-complete stack (Times New Roman first, then the Linux serif
  aliases). `--font-body` — the rest of the admin, the sans system stack
  (`-apple-system` / `Segoe UI` / `Roboto`) — was ALREADY Vietnamese-safe: do
  not "fix" it, and do NOT import Be Vietnam Pro into the admin (the site font
  belongs to `(frontend)` only). custom.scss is unlayered, so it wins the
  cascade against Payload's `@layer payload-default`.

## Front-end routing model — fixed route files + the dynamic `[slug]` fallback

Added 2026-10-01 ("serve CMS-created pages"). Before it, every public page had
its own fixed-slug route file under `src/app/(frontend)/` and there was NO
dynamic route, so **a page an editor created in the admin 404'd on the front
end** — while `/sitemap.xml` (`force-dynamic`, so it lists every published page
immediately) advertised that 404 to Google. `src/app/(frontend)/[slug]/page.tsx`
now serves any published Pages record that has no fixed route file.

**Both kinds of route exist on purpose.** Do not collapse the fixed files into
`[slug]` (or vice versa) without working through this list:

1. **The ten fixed route files carry the DB-less-build fallback the M1/M2/M3
   gates verified.** Each calls `getPage('<hardcoded slug>')`; `getPage`'s
   try/catch returns null when the docker builder has no database, the route
   bakes `notFound()`, and ISR heals it. They also carry page-specific
   DB-less `generateMetadata` fallbacks (e.g. `/chinh-sach-bao-mat/` falls back
   to the title `'Chính sách bảo mật'`, not to the bare brand). **A static
   segment wins over a dynamic one in Next's router**, so every fixed slug keeps
   its exact current behaviour and `[slug]` only ever handles pages beyond that
   set.
2. **`[slug]` is the fallback for CMS-created pages.** It reuses the same
   helpers as the fixed routes — `PageShell` for the render, `pageMetadata` →
   `buildMetadata` for metadata — so a dynamic page is byte-identical to a fixed
   one (one code path for the `<h1>`, metadata, JSON-LD and breadcrumbs). It
   exports `revalidate = 60`, matching every other record page. In a DB-less
   build its `generateStaticParams` yields `[]` (see below), so nothing is
   prerendered and every page renders on demand at runtime.

**Route conflict — checked empirically, and there is none.** A root-level
`(frontend)/[slug]` also *matches* `/admin`, `/api`, `/tin-tuc`, `/tim-kiem` and
`/og`, which live in the `(payload)` group or have their own route files.
`pnpm build` does **not** fail: Next resolves by precedence, and the build table
lists `ƒ /admin/[[...segments]]`, `ƒ /api/[...slug]`, `○ /gioi-thieu`, … unchanged
beside `● /[slug]` (the `●` is "uses generateStaticParams"; the route had no
prerendered paths because all ten slugs are fixed). Verified on a
`next start -p 3100` build: `/admin/` serves the Payload admin (login form,
`Bảng điều khiển — Quản trị Luật Gia Trí`), `/tin-tuc/` and `/tim-kiem/` serve
their own pages, `/og/page/<slug>/` still returns an image.

**Reserved slugs — the guard is in BOTH the route and the collection, on
purpose.** `src/lib/reserved-slugs.ts` lists the root segments that belong to
something other than the Pages collection: `admin`, `api`, `og`, `tin-tuc`,
`tim-kiem`, `_next`, `icon.svg`, `robots.txt`, `sitemap.xml` — plus `home` as a
ROOT ALIAS (the homepage is served at `/` by `(frontend)/page.tsx`; serving the
same record again at `/home/` would create a duplicate URL).

- **Route** — `isReservedSlug()` → `notFound()` before any DB read.
- **Collection** — `Pages.slug` gained a `validate` that rejects the reserved
  root segments, so the slug cannot be created at all (fails closed in the
  editor). **`home` is deliberately NOT rejected there**: the homepage record
  itself carries that slug. That is the one slug where the route guard and the
  collection guard intentionally disagree.
- **Sitemap** — `src/app/sitemap.ts` skips reserved slugs (`isReservedRootSegment`,
  not `isReservedSlug`, so `home` still maps to `/`), so the sitemap can never
  advertise a path the dynamic route refuses to serve. With all published pages
  routable, the earlier "sitemap lists a 404" defect is closed from both ends.

**`generateStaticParams` is DB-SAFE by construction.** It calls
`getPublishedPageSlugs()` (`src/lib/getPage.ts`), which returns `[]` when the
database is unreachable — the docker builder stage carries no `DATABASE_URI`, so
`next build` never fails and no known page is ever baked as a 404. Fixed-route
slugs are filtered out as well, so a static route file always keeps ownership of
its own path. (A `next build` with a live DB therefore still prerenders nothing
through this route; only pages created LATER would be, and they render on demand
under the route's ISR anyway.)

**Can the ten fixed routes be collapsed into `[slug]` later?** Yes in principle,
and it is the obvious end state — but only after: (1) the ten fixed slugs are
added to `generateStaticParams` so they still prerender at build, (2) a
slug→fallback-metadata map replaces the page-specific `generateMetadata`
fallbacks each fixed file carries today (or the project accepts the generic
`DEFAULT_BRAND` fallback), and (3) the M2/M3 DB-less-build convention is
re-verified for the ten, because their baked-fallback semantics are exactly what
those gates signed off on. Until then the duplication is the cheaper side of the
trade.

## On-demand revalidation — a CMS write purges the ISR cache (2026-10-01)

Every public route is time-based ISR (`revalidate = 60`), so before this an
editor's publish/edit took up to a minute to appear. Worse, a URL requested
BEFORE the page existed had that 404 CACHED, and it stayed 404 for the rest of
the window. `src/lib/revalidate-paths.ts` (pure: doc → paths) plus
`src/payload/hooks/revalidate.ts` (the runtime glue) now call Next's
`revalidatePath` from Payload hooks, so publish/edit/delete is immediate.

### Which paths each collection purges, and why

| change | paths | why |
| --- | --- | --- |
| Page created / updated / deleted | `/<slug>/` (**`/`** for the `home` record), `/og/page/<slug>/`, `/sitemap.xml` | the record's own URL; `home` is a ROOT ALIAS served at `/` (see the routing model above — never purge `/home/`); the OG card; the sitemap lists it |
| Post created / updated / deleted | `/tin-tuc/<slug>/`, `/tin-tuc/`, `/og/post/<slug>/`, **every category archive it belongs to** (`/tin-tuc/chuyen-muc/<slug>/`), `/sitemap.xml` | a post shows on its own page, in the news index, in the card and in each of its archives; the index and the archives have no other change event |
| Category changed / deleted | `/tin-tuc/chuyen-muc/<slug>/`, `/tin-tuc/`, `/sitemap.xml` | the archive itself plus the index listing |
| SiteSettings / Navigation | `revalidatePath('/', 'layout')` | these feed the header, footer, `<title>` and JSON-LD of EVERY page; a per-page list cannot be derived from a global, so a broad invalidate is correct here |
| Media | **nothing — deliberate gap** | bulk uploads happen during seeding (`pnpm seed:media` uploads 13 files + the logo) and there is no reliable way to map a media doc to the pages that reference it (the references are blocks/arrays of `upload` fields scattered across 15 block types). Revalidating everything on every media write would purge the whole site during a seed. A stale `og:image`/hero heals within the normal ISR window. Revisit only with a real reverse index. |

A **slug change** purges BOTH URLs (old and new) — the old one is now a 404. A
post that is re-filed purges the archives it LEFT as well as the ones it joined
(`previousDoc.categories`), or it would linger in the old archive.

Not needed, verified rather than assumed: **`/tim-kiem/` exports
`revalidate = 0`** (and the build marks it `ƒ (Dynamic)`), so a newly published
page appears in search results with no revalidation at all. **`/sitemap.xml` is
`force-dynamic`** (M3 post-gate fix), so it is already correct on the next
request and its `revalidatePath` is a no-op today — kept in the list so the
mapping stays correct if it ever returns to ISR. The generated OG routes
(`/og/[...slug]`) are `ƒ (Dynamic)` too, so their entries are likewise inert but
harmless.

### Hazard 1 — `afterChange` runs INSIDE the write transaction

Verified in the installed source (2026-10-01), not assumed:
`payload/dist/collections/operations/create.js` runs the collection
`afterChange` hooks at ~line 388 and calls `commitTransaction(req)` at line 421;
`update.js` commits at line 347 *after* its hooks; `delete.js` runs
`afterDelete` at ~line 204 and commits at line 270; globals
(`globals/operations/update.js`) run `afterChange` at ~407 and commit at 424.
**There is no post-commit hook anywhere in `payload/dist`** (no `afterCommit`
exists). Purging inside the hook would therefore run BEFORE the row is visible,
and a request landing in that window re-renders OLD data and re-caches it.

**A `setImmediate`/`process.nextTick` deferral does NOT fix it — and it silently
breaks the purge entirely.** Next collects `revalidatePath` calls in a
REQUEST-scoped `workStore.pendingRevalidatedTags` and flushes them in
`executeRevalidates(workStore)`; for a route handler that is
`route-modules/app-route/module.js`'s `resolvePendingRevalidations()`, which runs
in the microtask continuation right after the handler resolves — i.e.
immediately after the COMMIT. A `setImmediate` scheduled from the hook fires in
the next check phase, *after* that flush: measured, the tags were recorded
(`FileSystemCache: revalidateTag [...]` logged) but the cache was never
invalidated and the page stayed stale. `process.nextTick` is worse still — it
always runs before the COMMIT round-trip.

**The fix is `after()` from `next/server`.** An `after()` task runs when the
request closes — strictly after the response, hence strictly after the COMMIT —
and Next wraps the whole callback queue in `withExecuteRevalidates(workStore, …)`
(`server/after/after-context.js`, `runCallbacks()`), so revalidations performed
there ARE flushed. This also closes the hazard completely: any stale entry a
concurrent request manages to write in the residual window is timestamped
BEFORE the purge's `expiredAt`, so `areTagsExpired` still marks it expired.

`waitForCommit()` is kept anyway as an explicit, cheap assertion of the
invariant: `commitTransaction(req)` is literally
`await payload.db.commitTransaction(transactionID); delete req.transactionID`
(`payload/dist/utilities/commitTransaction.js`, and `killTransaction` deletes it
too), on the SAME `req` object the hook receives (`req` is destructured straight
off `args`, and the hook is invoked with `req: args.req`), so
`req.transactionID === undefined` is a precise post-commit signal. It normally
returns on its first check; the 5 s ceiling only stops a pathological
transaction from pinning a pending purge.

### Hazard 2 — a static `next/*` import breaks every standalone script

`pnpm seed`, `pnpm reindex`, `pnpm payload migrate`, `pnpm ga4:set/clear` and the
Payload CLI all load `payload.config.ts` → collections → the hook module under
`tsx`, OUTSIDE the Next runtime, where `next/cache` and `next/server` do not
exist. A static import breaks all of them. Both imports are therefore DYNAMIC
and guarded inside `getNextApis()`, cached per process, and `after()` itself
throws outside a request scope (caught) — so the whole hook is a silent no-op in
a script. Same class of fix as `search-text.ts` living apart from its hook.
Verified after the change: `pnpm seed`, `pnpm reindex`, `pnpm payload migrate`,
`pnpm ga4:set G-TEST123`, `pnpm ga4:clear` and `pnpm test` all still run clean
(the DB-less `docker build` also exercises it — its builder stage runs
`pnpm generate:types`, which loads the same config).

### The `type` argument trap (this one cost an hour)

`revalidatePath(path, 'page')` appends `/page` to the tag it invalidates
(`_N_T_/tin-tuc/page`), but the tag an ISR entry actually CARRIES for its own
URL is the bare pathname tag (`_N_T_/tin-tuc`) — read it out of
`.next/server/app/<route>.meta`'s `x-next-cache-tags`. So passing a `type` for a
record path invalidates nothing at all, silently. Record paths are revalidated
with NO type; only the globals case passes one (`('/','layout')` →
`_N_T_/layout`, the derived root-layout tag every page carries).

### How this was verified (2026-10-01)

Against a `pnpm build && next start -p 3100` build, driving every write through
the running server's REST API so the hooks execute inside Next (a tsx script
would run them outside it):

- **Cached-404 case:** `GET /<new-slug>/` twice → `404` / `x-nextjs-cache: HIT`;
  create the page published; the very next `GET` → **`200` in 87 ms**
  (`x-nextjs-cache: MISS`, 188 ms after the 404 was cached). A MISS means the
  entry was found-unusable, i.e. INVALIDATED — and 188 ms is ~0.3 % of the 60 s
  window, so time-based expiry cannot explain it. With
  `NEXT_PRIVATE_DEBUG_CACHE=1` the same moment logs
  `FileSystemCache: revalidateTag ['_N_T_/<slug>', …]`.
- Edit → immediate (PATCH `primaryHeading`, next GET reflects it), post →
  index + archive + sitemap, delete → immediate 404, globals → every page
  (`/gioi-thieu/` MISS with the new brand, and again on restore).
- `pnpm e2e` 29/29 — the GA4 consent test needs the documented
  `pnpm ga4:set <id>` → build → start → e2e → `clear` sequence, or the banner is
  not in the prerendered HTML; `pnpm test` 107/107; DB-less
  `docker build --target runner` exits 0.

## Live Preview — draft preview via Next Draft Mode (2026-10-02)

The admin Preview (eye) icon used to 404 on an unpublished draft:
`livePreview.url` returned the bare public URL, `getPage`/`getPost` always queried
`draft: false`, and nothing ever enabled Next's draft mode. Fixed end-to-end. This
section is the mechanism plus the security argument. **No new env var was needed.**

### The supported mechanism (read out of the installed packages, not assumed)

- `payload@3.90.2` `LivePreviewConfig.url`
  (`node_modules/payload/dist/config/types.d.ts:80-124`) is
  `string | ((args) => string | null | Promise<…>)`. A plain string is used
  VERBATIM; a function is executed per request by `handleLivePreview`
  (`@payloadcms/ui/dist/utilities/handleLivePreview.js:39-95`), which passes
  `{ collectionConfig, data, globalConfig, locale, payload, req }`.
- `@payloadcms/next/dist/views/Document/index.js:300-358` runs it and hands the
  result to `LivePreviewProvider` as `url`; `LivePreviewWindow`
  (`@payloadcms/ui/dist/elements/LivePreview/Window/index.js:98-122`) renders
  `<IframeLoader src={url}>`. So **the iframe loads `livePreview.url` exactly** —
  there is no Payload-side route shape, wrapper, or required query parameter. The
  `/next/preview/?path=…` shape is ours.
- `@payloadcms/next` ships NO draft-mode/preview helper (`dist/utilities/` and
  `dist/exports/utilities.js` have none), so the route is the standard Next recipe.
- The admin posts `{type:'payload-live-preview', data:<current form values>}` into
  the iframe on every form change, and `{type:'payload-document-event'}` on a
  document event (`Window/index.js:46-94`). Payload's fully-live client hook
  (`@payloadcms/live-preview-react`) is NOT installed.

### Authorisation — the admin session; no URL secret

`/next/preview` validates the request with `payload.auth({ headers })` and requires
a user whose `roles` include admin/editor, BEFORE `draftMode()` is touched. A failed
authorisation returns 403 and never enables draft mode (verified end-to-end).

No `PREVIEW_SECRET` — and certainly no `PAYLOAD_SECRET` — appears in any URL or in
any HTML, because the session check is sufficient: **Next's bypass cookie is itself
unforgeable.** `DraftModeProvider.isEnabled`
(`next/dist/server/async-storage/draft-mode-provider.js:12-26`) is
`cookieValue === previewProps.previewModeId`, and `previewModeId` is the server-only
build-time secret `__NEXT_PREVIEW_MODE_ID` (set only for the server/edge runtime in
`next/dist/build/webpack-config.js`; never in the client bundle). The only way to
obtain the cookie is through the auth-gated route — verified: a forged
`__prerender_bypass=…` cookie does not enable draft mode.

### The pieces

| piece | file |
| --- | --- |
| preview entry (authorise → `draftMode().enable()` → redirect) | `src/app/(frontend)/next/preview/route.ts` |
| exit (`draftMode().disable()` → redirect back) | `src/app/(frontend)/next/exit-preview/route.ts` |
| guarded draft-mode read + open-redirect guard | `src/lib/draft-mode.ts` |
| draft-aware fetch | `getPage` / `getPost` in `src/lib/getPage.ts` |
| indicator + refresh bridge | `src/components/DraftPreviewBar.tsx`, mounted from `(frontend)/layout.tsx` |
| `livePreview.url` (Pages + Posts) | `.../collections/Pages.ts`, `.../collections/Posts.ts` |

- Both `livePreview.url` functions build the target path from the SHARED
  `pageUrl`/`postUrl` helpers (`src/lib/revalidate-paths.ts`) and emit
  `/next/preview/?path=<encoded>`. The trailing slash is the canonical route form
  under `trailingSlash: true` — without it every preview eats an extra 308 first.
  (Bonus fix: `pageUrl('home')` is `/`, so the home record now previews at `/`
  instead of the unroutable `/home`.)
- `next` was added to `RESERVED_ROOT_SEGMENTS` (`src/lib/reserved-slugs.ts`), so no
  Page can claim that slug — the route guard AND the collection validation both use
  it. The slug field's `description` and validation message were updated to list it
  (that is the only reason `payload-types.ts` changed).

### The guarded `draftMode()` read — why the guard is load-bearing

`isDraftModeEnabled()` uses the DYNAMIC guarded import (the `revalidate.ts` pattern,
AGENTS "Hazard 2"): `draftMode()` THROWS outside a request (`seed`/`reindex`/CLI/
vitest) and inside `generateStaticParams` (case `'generate-static-params'`). It does
NOT throw in normal prerender — the `'prerender'` branch returns an EMPTY draft mode
whose `isEnabled` is `false` — so the published filter is in force at build and the
ISR/static semantics survive (the build table still lists every fixed route
`○ (Static)` with `1m` revalidate). Fail closed: any unreadable case ⇒ `false`.

`getPage`/`getPost` drop the `_status: 'published'` filter and pass
`draft: isDraftModeEnabled()` ONLY when the cookie is present; otherwise the query is
unchanged. `getPublishedPageSlugs` deliberately does NOT read draft mode — it runs in
`generateStaticParams`, where the call would throw.

### Indexing

- `/next` is in `robots.ts`'s disallow list (beside `/admin`, `/api/`).
- Any response carrying the draft bypass cookie gets `X-Robots-Tag: noindex, nofollow`
  via `next.config.ts` `headers()` with a `has: [{ type: 'cookie' }]` condition —
  declarative, no middleware, and it covers the arbitrary slugs a draft can be served
  at. Verified: a normal page has NO such header and stays ISR-cacheable; a
  draft-cookie request gets it.
- Crawlers cannot obtain the cookie at all (unforgeable + auth-gated), and Next serves
  draft responses `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`.

### What works, honestly

- **The client's case is fixed**: opening the admin Preview on the unpublished draft
  `Trang kiểm thử tất cả khối` (id 25, `_status: draft`) renders the page in the pane
  with all 15 blocks (measured in a real browser: 15 `<section>`, one `<h1>`, no 404).
  The page was NOT modified.
- **UNSAVED edits do NOT appear.** Payload 3.90.2 has no autosave on Pages/Posts, so
  the admin posts the unsaved values but nothing re-reads them; rendering them would
  need a client-side block renderer (out of scope). **SAVED edits DO appear**:
  `DraftPreviewBar` listens for `payload-document-event` and calls `router.refresh()`,
  which re-fetches the freshly saved draft. Both verified in a real browser.
- Fully-live editing would need `versions.drafts.autosave` on the collections or the
  `@payloadcms/live-preview-react` hook — neither is enabled, deliberately.

## Floating contact buttons (Phone / Zalo / Facebook) — 2026-10-02

Client request: a fixed bottom-right stack of circular quick-contact buttons.
Lives in `src/components/chrome/FloatingContact.tsx`, rendered from
`(frontend)/layout.tsx` with the values passed as props off the ALREADY-read
`getSiteSettings()` — the component never fetches, so it adds no DB call to the
prerender path.

- **Server component by design** — three plain `<a>` tags need no JavaScript,
  and the site keeps its client islands minimal (HeroCarousel, LeadForm). No
  `'use client'`, no dependency. Icons are inline SVG (phone handset; the Zalo
  wordmark; the Messenger bubble+bolt via `fill-rule="evenodd"`, because the
  client asked for Facebook *message*, not the plain "f"). The component emits
  NO headings (`heading-discipline.spec.ts`).
- **ONE SOURCE PER BUTTON — there are NO fallback URL constants** (same anti-trap
  reasoning that removed the GA4 env fallback; a value with two sources is a
  trap):
  - **Phone** — `tel:<hotline digits>` from the required `SiteSettings.hotline`
    (live `0919088119` → `tel:0919088119`).
  - **Zalo** — `https://zalo.me/<hotline digits>` derived from the SAME
    `hotline`. `ZALO_BASE_URL` is the only exported constant. `socials.zalo` is
    deliberately NOT consulted here (it stays in the schema for schema.org
    `sameAs`).
  - **Facebook** — `SiteSettings.socials.facebook` is the ONLY source. **When it
    is empty the button is NOT rendered at all** — no default URL, no `#`, no
    empty `href`. The button appears the moment the firm enters their profile
    URL in the admin (Thông tin website); no deploy.
- **`scripts/seed.ts` writes the SiteSettings global UNCONDITIONALLY** — the
  `payload.updateGlobal` at `seed.ts:156` sets brandName/hotline/email/address
  on EVERY seed run and omits `socials`. The Facebook URL is therefore
  deliberately **NOT in the seed**: writing it there would clobber a value the
  firm later edits in the admin. The dev DB was set once via the **Local API**
  (`payload.updateGlobal`); **a fresh DB — and production — needs the URL
  entered once in the admin.** (`socials.zalo` is not needed by this button.)
- **Consent-banner collision — the deliberate z-index/offset decision.** The
  banner is `fixed inset-x-0 bottom-0 z-50` and owns the whole bottom strip. The
  stack is `z-[60]` and is LIFTED clear of the banner by a CSS-only rule in
  `globals.css`, keyed on the banner's own DOM:
  `body:has([role='dialog'][aria-label='Thông báo cookie']) .floating-contact
  { bottom: 11rem }` (7rem at ≥768px). `:has()` watches the real DOM, so the
  stack drops back to `bottom-6` the instant the visitor answers (the banner
  unmounts); when GA4 is off there is no banner and the rule never applies.
  Measured: banner 70px tall / stack lifted to 112px on desktop (42px gap);
  banner 142px / stack lifted to 176px at 375px (34px gap) — both usable, never
  hidden.
- **Focus ring = the project's teal** `#0f908a` (= `--theme-success-500`), 2px
  with a 2px offset, set in `globals.css` (not a Tailwind variant). `#0f908a`
  measures 3.9:1 on white and 4.1:1 on the navy footer; the brand teal chip
  `#34b1aa` is only 2.6:1 on white, which is why the darker stop is used.
  Measured glyph-on-background contrasts: navy `#002147` 16.06:1, Zalo
  `#0068FF` 4.75:1, Messenger gradient `#1877F2`→`#A033FF` 4.23–4.85:1 — all
  ≥ 3:1 (WCAG non-text contrast). Zalo (flat blue) and Messenger (blue→violet
  gradient) are separated on purpose so the two blue brands never read alike.
- **Links:** Zalo + Facebook carry `target="_blank" rel="noopener noreferrer"`;
  the `tel:` link carries neither.
- Verified 2026-10-02 against `pnpm build && pnpm exec next start -p 3100`:
  resolved hrefs `tel:0919088119`, `https://zalo.me/0919088119`,
  `https://www.facebook.com/profile.php?id=61580495127981`. The hide-when-empty
  path was proven BOTH ways by clearing then restoring `socials.facebook` via the
  Local API and watching ISR heal (button gone at ~35s, back at ~55s). `pnpm test`
  107, `pnpm e2e` 29, `pnpm typecheck` clean, DB-less
  `docker build --build-arg SITE_ENV=production … --target runner` exits 0 with
  the component present in `.next/server`. Screenshots (untracked):
  `docs/admin-shots/m5-floating-*.png`.

## Authored (non-ported) content — the ONE exception to the port-only law

Spec §3.2 ("port copy verbatim, invent no legal or pricing copy") governs this
site; every byte of the 9 migrated pages was ported byte-verified from the live
site. The **three Posts in `seed/content/posts/` are a deliberate, documented
exception**: they are AI-compiled placeholder articles on recent
business-registration instruments, **NOT reviewed by the firm's lawyers** and
**NOT official firm content** until the firm verifies and adjusts every
sentence. The review requirement lives in `seed/content/_notes.json` →
`authoredLegalPosts` (the client's handover file) and in this note — there is
deliberately **no in-body review banner** (published copy must read cleanly), so
those two records are the ONLY marker that this content is AI-compiled.

Rules for this content:

- Seeded `_status: 'published'` — a client decision (fill the site now, verify
  the wording later; the site is not deployed yet, so nothing is public). The
  fixture carries `_status`; `scripts/seed-posts.ts` passes it through.
- Every substantive claim is anchored to its instrument (number + effective
  date) with a source link; **contested points are OMITTED, not asserted**. The
  05-vs-06-year non-listed-JSC shareholder-record retention conflict is the
  worked example — see `_notes.json`.
- Fixtures live in `seed/content/posts/` (a SUBFOLDER) so the flat
  `seed/content/*.json` scans in `scripts/seed.ts` (pages) and
  `scripts/seed-media.ts` (media refs) cannot mistake them for pages;
  `seed-media.ts` walks the subfolder explicitly so a fresh DB still uploads
  the hero images.
- Seeded by `pnpm seed:posts` — idempotent upsert by slug. It resolves
  `author`/`categories` slugs → ids and `{mediaRef, alt}` → media id via
  `_media-map.json` (same indirection as `seed.ts`).
- Featured images are the firm's OWN seeded `img-blog-*` media used as
  placeholders — **replace with purpose-made artwork**. No third-party assets.

### Lexical fixture gotchas (re-confirmed 2026-10-02, seeded Posts)

- **Bold is `"format": 1`** — `"bold": true` is SILENTLY IGNORED by both the
  JSX and HTML converters (M3 note above). All seeded bold runs use `format: 1`.
- **`listitem.indent` MUST be the NUMBER `0`** (plus `tag: 'ul'|'ol'` on the list
  node and a numeric `value` per item), or the ADMIN editor throws
  `Invalid indent value.` while the front end renders fine. Verified by opening
  all three seeded Posts in the admin (mounts clean, 0 console errors).
- **Link nodes round-trip** as `{type:'link', version:3, id:'<24-hex>',
  fields:{linkType:'custom', newTab, url}, format:'', indent:0, direction:'ltr',
  children:[text]}` — `indent` is again the NUMBER `0`, and `id` is a 24-char
  hex ObjectID. Payload stores them and the admin/editor and front-end converter
  both handle them (verified 2026-10-02). No seeded Post is dropped on load.

## Bespoke `/lien-he/` layout — cards, click-to-load map, map+form row (2026-10-02)

`/lien-he/` is the ONE route that does not render `<PageShell>` (client request:
its content is channels + location + form, not prose).
`src/app/(frontend)/lien-he/page.tsx` renders a purpose-built layout, but keeps
PageShell's two structural promises — `<JsonLd data={pageSchemas(page)} />` and
the page's single `<h1>` from `page.primaryHeading` (spec §6.4).

- **Order:** `<h1>` → `ContactChannels` (four tiles: Phone · Zalo · Email ·
  Messenger) → one two-column row: map LEFT (`LocationCard`), form RIGHT →
  end. Every value comes from `SiteSettings`, read ONCE by the route and passed
  down. The map card is FIRST in the DOM, so mobile stacks map-above-form
  (DOM order === visual order at both breakpoints; flip with `order-*` if the
  client prefers form-first on mobile). `items-stretch` + `flex-1` +
  `min-h-[320px]` make the map match the form's height instead of collapsing.
- **Shared module — `src/lib/contact-links.ts` + `src/components/icons/
  contact.tsx`.** The floating buttons and the cards import the SAME SVGs
  (phone, Zalo wordmark, Messenger bubble; the cards add mail + map-pin, same
  24×24 / stroke-2 family) and the same `telHref`/`zaloHref`/`formatHotline`
  rules — one definition per channel, so the surfaces cannot drift.
  `FloatingContact` still exports `ZALO_BASE_URL` (re-export) and its rendered
  output is unchanged.
- **The map is CLICK-TO-LOAD** (`src/components/lien-he/MapEmbed.tsx`, a tiny
  `'use client'` island). An always-on Google iframe sends the visitor's IP to
  Google and can set Google cookies BEFORE consent — contradicting the Nghị
  định 13 gate on GA4 and the firm's own privacy policy. So the iframe is not in
  the DOM until "Xem bản đồ" is clicked: verified **0** google-* requests before
  the click, the `output=embed` iframe (coords `10.8009031,106.5920852` — the
  resolved `maps.app.goo.gl/dQeNuXRD6m3fzHgV6`) after. A `<details>` would NOT
  work: browsers still load an iframe inside a closed one.
- **`FormEmbedView` gained `variant?: 'section' | 'plain'`.** `'section'` is the
  default and unchanged (what `<Renderer>` uses on every other page); `'plain'`
  drops the full-width tinted band + `py-section` so the form sits in the row's
  right-hand card. Heading/intro still come from the block → still CMS-managed.
- **Two blocks deleted** from the DB (`pages_blocks_cta_banner` /
  `pages_blocks_rich_text`, page 8) AND from `seed/content/lien-he.json`:
  `cta_banner` (its CTA pointed at `/lien-he/` — the page it was on) and
  `rich_text` (the ported contact info, now rendered from `SiteSettings`). Only
  `form_embed` remains; a re-seed reproduces that with no duplicates.
- **Knock-on:** the derived meta description now falls past the removed richText
  to `primaryHeading` → `"Liên Hệ Luật Gia Trí"` (was `"Địa chỉ: … Email: … Phone:
  …"`). Cleaner, but still a heading, not a SERP pitch — the `_notes.json`
  `needsHandWrittenCopy` flag was updated to the new value and stays open.
  `heading-discipline.spec.ts` and `crawl.spec.ts` both still cover the route.
- The `#0f908a` focus ring (`.contact-focus`) and the `.map-placeholder`
  blueprint grid live in `globals.css` beside the floating-contact rules.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
