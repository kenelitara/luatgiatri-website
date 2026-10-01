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

- **`NEXT_PUBLIC_GA4_ID` is inlined at `pnpm build` time — it is a Docker
  build arg, NOT a runtime knob (same class as `SITE_ENV`).** The layout reads
  `process.env.NEXT_PUBLIC_GA4_ID` and Next replaces the reference with the
  build-time literal, so the compiled chunk bakes `ga4Id:"G-TEST123"` (or
  `ga4Id:void 0` when unset). Consequence: the plan's original Step 3
  verification command — `NEXT_PUBLIC_GA4_ID=G-TEST123 next start -p 3100`
  against a default build — proves nothing (the banner grep returns 0); the id
  must be present at build time. Consequence for deploy: because `.dockerignore`
  excludes `.env`, an image built without the build arg is permanently
  GA4-less even if `.env` carries an id, so `Dockerfile` declares
  `ARG NEXT_PUBLIC_GA4_ID=` (+ `ENV`, empty default, no `test -n` fail-fast —
  an absent id is legitimate) and `docker-compose.vps.yml` passes
  `${NEXT_PUBLIC_GA4_ID:-}`. Empty id ⇒ the banner renders nothing and no
  analytics script ships. Verified both ways 2026-10-01.

## Stack rules — Payload 3.90.2 + Next 16.3.6

- Payload is **embedded**: no separate backend, no REST from the browser. Public
  pages read via the Local API; the lead form uses a server action (M3). Never
  call Payload REST from client components.
- **Admin UI is Vietnamese** (`i18n.supportedLanguages: { vi }`). Every new
  collection/field/block label is written in Vietnamese. Content `localization`
  is NOT enabled and must not be enabled (single-locale site, spec §5.7).
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
version:0, value:0, children:[paragraph…]}]}`. Also: seeded pages need
  `_status: 'published'` (drafts are on) or Task 21's published-only
  `getPage()` finds nothing, and the Payload DB pool keeps tsx scripts alive —
  call `process.exit()` at the end of seed scripts.
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

## UI notes — favicon & admin fonts (2026-10-01)

- **Favicon = `src/app/icon.svg`** (Next file convention → `<link rel="icon">`
  on every `(frontend)` route). It is a committed static asset derived from
  `data/media/Gia-Tri-Law-logo.svg`, NOT the seeded media doc, so the tab icon
  never depends on the media DB or the domain. It frames the logo's **GT
  monogram** (`<g id="brand-mark">`, copied byte-identical) in a square
  transparent `viewBox`: the wordmark + tagline are illegible at 16px, and a
  brand-navy plate would hide the navy `#002147` half of the monogram. `/admin`
  keeps Payload's own default favicon — the site icon does not reach it
  (Payload's `RootLayout` renders its own `<html>`); override with
  `admin.meta.icons` in `payload.config.ts` if that ever matters.
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
