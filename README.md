# luatgiatri-website

Rebuild of the Luật Gia Trí website (https://luatgiatri.com/) — a Vietnamese
legal and accounting services firm. Next.js 16 + Payload CMS 3 + Postgres,
built to the Elitara Docker standard and deployed to Dokploy.

Content is ported verbatim from the live site's 9 existing pages (captured in
`seed/raw/`), redesigned to the attorneyshere.com structural pattern with the
client's brand colors (`#002147` deep blue + `#ffd700` gold).

## Stack

- **Next.js 16.3.6** (app router, Turbopack, standalone output) — public site
- **Payload CMS 3.90.2** — embedded, admin at `/admin`, fully Vietnamese UI
- **Postgres 16** — Docker (dev publishes `127.0.0.1:5432`)
- **Tailwind CSS 4** — design tokens in `src/app/globals.css`
- pnpm 10 · Node ≥ 22.12

See `AGENTS.md` for stack-specific rules and every verified API gotcha.

## Local development

```bash
pnpm install
cp .env.example .env          # fill in real values (PAYLOAD_SECRET etc.)

docker compose up -d db       # Postgres on 127.0.0.1:5432
pnpm payload migrate          # one-shot
pnpm seed:media && pnpm seed  # 13 images + admin/authors/globals/9 pages (idempotent)

pnpm dev                      # http://localhost:3000  (admin: /admin)
```

Gates:

```bash
pnpm typecheck && pnpm test   # 12 unit tests (slugify, Renderer, HeroCarousel)
pnpm build && pnpm e2e        # Playwright heading-discipline gate (port 3100)
```

## Project structure

```
src/app/(frontend)/   public site routes (9 preserved URLs + home + news)
src/app/(payload)/    Payload admin + REST/GraphQL (template shapes)
src/components/       chrome (TopBar/Header/Footer), block views, HeroCarousel
src/payload/           collections, globals, access, blocks (14 block types)
src/lib/               slugify, site data, getPage, date formatting
seed/raw/              verbatim HTML capture of the live site (9 pages)
seed/content/          block-structured fixtures + media map + notes
scripts/               capture-content, seed-media, seed
tests/e2e/             Playwright heading-discipline gate
docs/                  DEPLOYMENT.md + planning docs
```

Design spec: `../../docs/superpowers/specs/2026-10-01-luatgiatri-website-design.md`
Implementation plan: `../../docs/superpowers/plans/2026-10-01-luatgiatri-website-m1-m2.md`

## Deployment

**Dokploy** is the production target; the Nginx Proxy Manager compose is the
labelled backup. Full guide — env vars, build args, the one-shot
migrate/seed flow, media volume, backups, cutover checklist, and the
deploy-specific failure modes — in **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**.

Workspace references: `../../DEPLOY-VPS-MULTI.md` (VPS playbook, source of
truth) and `../../DOKPLOY-VPS.md` (Dokploy box setup).
