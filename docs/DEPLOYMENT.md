# luatgiatri-website — Deployment

Project-specific deployment guide. The workspace playbooks are the source of
truth for anything VPS-wide; this file records only what is specific to
**this** project: image shape, env vars, the one-shot migrate/seed flow, the
media volume, and the cutover checklist.

| Reference | Covers |
| --- | --- |
| `../../DEPLOY-VPS-MULTI.md` | The durable core: VPS hardening, Docker install, NPM reverse proxy, per-project folder layout (§10), proxy hosts (§11), backups (§14), pgAdmin SSH-tunnel access (§14.11) |
| `../../DOKPLOY-VPS.md` | The Dokploy PaaS box (Traefik owns 80/443, Swarm-native, built-in monitoring/volume backups) |
| `../AGENTS.md` | Stack rules + every verified Payload/Next gotcha (read before touching deploy config) |
| `../docker-compose.vps.yml` | The labelled-backup compose (NPM path) |
| Spec §11 (`docs/superpowers/specs/2026-10-01-luatgiatri-website-design.md`) | Cutover/redirect inventory, volumes, migration policy |

**Production target: Dokploy** (workspace decision — `vps-1`'s NPM compose is
retained as the labelled backup, not the primary path).

---

## 1. What gets deployed

One Next.js 16 image (standalone output) that embeds Payload CMS, plus a
Postgres 16 database and a media volume.

| Piece | Detail |
| --- | --- |
| App image | `Dockerfile` target `runner` — non-root `nextjs` (uid 1001), `node server.js`, port 3000, `HEALTHCHECK` on `/api/health` (opens a real Postgres connection) |
| Database | Postgres 16. Dev: `docker-compose.yml` publishes `127.0.0.1:5432`. Prod: never published — Dokploy managed DB (or the compose `db` service on the internal network) |
| Media volume | `./data/media` → `/app/data/media` (Payload uploads). **Must be in backups** — losing it loses every uploaded image while the DB still references them |
| Migrations | One-shot only — **never** on container start (`docker compose --profile migrate up migrate`, or the equivalent Dokploy one-off command) |
| Seed | `pnpm seed:media` then `pnpm seed` — idempotent; provision admin user, authors, taxonomy, globals, 13 media, 9 pages |

The app serves media through the API route at `/api/media/file/<filename>`
(robots.txt keeps `Allow: /api/media/` ahead of `Disallow: /api/` so
Googlebot-Image is not blocked).

## 2. Environment variables

Build-time (baked into prerendered `robots.ts`/metadata — a staging image can
never serve production indexing, and vice versa):

| Var | Staging | Production |
| --- | --- | --- |
| `SITE_ENV` | `staging` (forces `Disallow: /` + `noindex`) | `production` |
| `NEXT_PUBLIC_SERVER_URL` | the staging URL | `https://luatgiatri.com` |

GA4 is deliberately **not** an env var any more: the measurement id lives in
the `SiteSettings` global (admin → Thông tin website → GA4 Measurement ID) and
is read server-side by the layout. It needs no rebuild and no deploy-time
change — leave it empty to ship without analytics.

Runtime (never baked; `env_file`/Dokploy env only):

| Var | Notes |
| --- | --- |
| `DATABASE_URI` | `postgres://USER:PASS@HOST:5432/DB` — in-container host is `db` (compose) or the Dokploy DB host |
| `PAYLOAD_SECRET` | **Required in production** — the config fail-fasts the container without it (deliberate: no placeholder secret, forgeable sessions). Must NOT be set in any compose `environment:` block |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | database container + the `DATABASE_URI` interpolation |
| `IP_HASH_SALT` | lead-capture IP hashing (M3) |
| `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD` | **first-deploy seed only** — creates the admin user when `users` is empty. Remove from the production env after the first seed (the admin can then change the password in the UI) |

`.env.example` lists every variable; the real `.env` is gitignored and never
committed.

## 3. Deploy to Dokploy (primary)

1. **Box**: one-time setup per `DOKPLOY-VPS.md` (its §0–§9: hardening steps are
   referenced from `DEPLOY-VPS-MULTI.md`; Dokploy bundles Traefik on 80/443 and
   initialises Swarm).
2. **App**: Dokploy → Create Application → Git source
   `github.com/kenelitara/luatgiatri-website`, branch `main`, build type
   **Dockerfile**.
   - **Build args**: `SITE_ENV=production`, `NEXT_PUBLIC_SERVER_URL=https://luatgiatri.com` (GA4 is not a build arg — set the id in the admin after deploying)
   - **Env**: the runtime table above (`DATABASE_URI`, `PAYLOAD_SECRET`, `IP_HASH_SALT`)
   - **Port**: 3000. **Healthcheck**: path `/api/health`
   - **Volume**: mount `data/media` → `/app/data/media` (survives redeploys and
     is covered by Dokploy's volume backups)
3. **Database**: Dokploy → Create Database → Postgres 16. Copy its connection
   string into the app's `DATABASE_URI`. (Alternatively run the compose `db`
   service — but never publish 5432 publicly.)
4. **Migrate (one-off)**: in the app's Dokploy terminal (or a one-shot
   service), run `pnpm payload migrate`. Fresh databases are non-interactive;
   a never-dev-pushed DB has no "dev mode / data loss" prompt. **Never** wire
   migrations into container start.
5. **Seed (first deploy only)**: `pnpm seed:media && pnpm seed` — uploads the
   13 images and provisions admin/authors/taxonomy/globals/9 pages. Idempotent;
   safe to re-run after content edits (it upserts by slug).
6. **Domain**: point `luatgiatri.com` at the app in Dokploy (Traefik router);
   issue TLS. Confirm `https://luatgiatri.com/robots.txt` serves the
   **production** shape (`Allow: /`, `Allow: /api/media/`, `Disallow: /admin`,
   `Disallow: /api/`, `Sitemap: https://luatgiatri.com/sitemap.xml`) — if it
   serves `Disallow: /`, the image was built with a staging `SITE_ENV` build arg.

### Staging app

Create a second Dokploy application from the same repo with a staging domain
and `SITE_ENV=staging` as a **build arg**. Staging is forced `noindex` at the
image level — it cannot be overridden from the admin (spec §6.5).

## 4. NPM backup path (labelled, `vps-1`)

Per the workspace convention the Nginx Proxy Manager compose is retained as a
labelled backup deploy:

```bash
# on the host, inside the project folder (playbook §10 layout)
docker compose -f docker-compose.vps.yml up -d
docker compose -f docker-compose.vps.yml --profile migrate up migrate   # one-shot
```

Then add the proxy host in NPM (playbook §11) for `luatgiatri.com` → the app
container on the shared `proxy` network. **Linux bind-mount caveat**: before
the first start on a real Linux host,

```bash
mkdir -p data/media && sudo chown 1001:1001 data/media
```

Bind mounts bypass the image's build-time chown; named volumes (Dokploy) seed
from the image and keep it. `./data/db` is immune (the Postgres entrypoint
chowns its own data dir).

## 5. Backups (spec §11.1)

Two things must be backed up together — they are useless apart:

- **`data/db`** — periodic `pg_dump` per the playbook's backup section
  (`DEPLOY-VPS-MULTI.md` §14). The dump is the portable form.
- **`data/media`** — the upload files themselves. A DB backup alone restores
  rows that point at missing images.

Dokploy's built-in volume backups cover both when the volumes are declared in
the app. On the NPM path, back up both host directories on the same schedule.

## 6. Cutover checklist (spec §11.3)

Launch is a **first indexation from zero** — the live WordPress site is
`noindex` sitewide (spec §2.1), so nothing is ranking to preserve. Set that
expectation with the client.

1. Import the old-URL inventory into the `Redirects` collection: `/blocks/*`
   (410), `/feed/` → `/tin-tuc/rss.xml`, category/tag/author archives → nearest
   equivalent, `?p=ID` → canonical, `/?s=` → `/tim-kiem/`, `/xmlrpc.php` +
   `/wp-login.php` (410), Rank Math sitemap/XSL paths (410).
2. Review staging end to end with `noindex` forced.
3. Move DNS. **Keep WordPress running read-only for a rollback window.**
4. Submit the sitemap in Search Console; request indexing; watch coverage.
5. Google Business Profile: create/claim, category "Law firm"/"Luật sư", set
   the website URL, add the profile URL to `SiteSettings.socials` (spec §6.9 —
   the brand-SERP launch gate).

## 7. Troubleshooting the deploy-specific failures

| Symptom | Cause / fix |
| --- | --- |
| Container crash-loops at boot | `PAYLOAD_SECRET` unset in production — that is the deliberate fail-fast. Set it |
| `robots.txt` serves the wrong shape | The image was built with the wrong `SITE_ENV` **build arg** — rebuild; it is baked, not runtime |
| Migrate hangs forever in automation | The target DB has a dev-push record (`payload_migrations` `batch: -1`) → the tool prompts interactively with no TTY. Only ever point the one-shot service at a never-dev-pushed DB |
| Images 404 / "not a valid image" | Payload appends the app's trailing slash to media URLs (via `withPayload`'s `NEXT_TRAILING_SLASH`); the Media `afterRead` hook strips it. If images break after an upgrade, check that hook first (see AGENTS.md, "Media URLs") |
| Uploads fail on first use (Linux bind mount) | `data/media` ownership — run the chown above |
| Healthcheck red though the app responds | `/api/health` must open a real Postgres connection — a DB/credentials problem is the real failure, not the app |
