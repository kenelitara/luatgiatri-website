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
  options). `staticURL`/`staticDir` belong to each upload-enabled collection —
  set them on the Media collection when it is created (`data/` is gitignored
  wholesale already, so `data/media/` needs no extra entry).
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

<!-- BEGIN:nextjs-agent-rules -->

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
- **M2 convention — DB-dependent routes at build time.** No route may hit the
  DB during `next build`. Strategy (a) is the convention: DB-dependent routes
  wrap their fetches in try/catch and render a static fallback that ISR
  replaces on the first runtime revalidation (Task 21 implements this).
  `force-dynamic` (loses ISR) is the fallback if (a) proves unworkable —
  document it here if it ever happens.
- **`data/` is gitignored wholesale** — `data/db`, `data/media`, and any
  future upload contents; there is no committed marker inside it.
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

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
