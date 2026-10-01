# luatgiatri-website

> One-line description of what this project does.

## Stack

_To be filled in after scaffolding._ See `AGENTS.md` for stack-specific rules.

## Local development

```bash
# Install deps (replace with stack-equivalent if not pnpm)
pnpm install

# Copy env template
cp .env.example .env
# …fill in real values…

# Run dev stack (app + db if applicable)
docker compose up --build
```

App available at `http://localhost:3000` (default — adjust per stack).

## Deployment

Deployed to the shared VPS following `DEPLOY-VPS-MULTI.md` at the workspace root.
Production compose file: `docker-compose.vps.yml`.
Reverse-proxied via Nginx Proxy Manager on the shared `proxy` network.

## Project structure

- `src/` — application source
- `docs/` — specs, design docs, ADRs
- `scripts/` — project-specific scripts (backups, migrations, etc.)
- `tests/` — unit + integration tests
- `AGENTS.md` — Claude Code rules for this project (imported via `CLAUDE.md`)
