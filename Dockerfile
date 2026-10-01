# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-alpine

# --- deps ---
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN npm i -g pnpm@10.33.2
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# --- dev ---
# docker-compose.yml targets this stage. It is deps + nothing else: dev must
# not pay for a production build. The source tree and node_modules arrive as
# compose volume mounts; the compose command runs `pnpm install && pnpm dev`.
FROM deps AS dev

# --- builder ---
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN npm i -g pnpm@10.33.2
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# SITE_ENV and NEXT_PUBLIC_SERVER_URL are baked into prerendered output
# (robots.ts, metadata) — they are build-time inputs, passed as build args.
ARG SITE_ENV=production
ENV SITE_ENV=$SITE_ENV
ARG NEXT_PUBLIC_SERVER_URL=https://luatgiatri.com
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
# No silent prod fallback: an unset/empty public URL must fail the build loudly.
RUN test -n "$NEXT_PUBLIC_SERVER_URL"
# No secrets at build: payload.config.ts's PAYLOAD_SECRET gate skips
# NEXT_PHASE=phase-production-build, so `pnpm build` needs none; DATABASE_URI
# and PAYLOAD_SECRET are runtime-only. No route hits the DB at build time
# (M2 convention in AGENTS.md). generate:types is best-effort.
RUN pnpm generate:types || true
RUN pnpm build

# --- runner ---
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Media volume mount point (compose mounts ./data/media here). The runner
# deliberately contains NO migrations — migrations run via the one-shot
# `migrate` compose service (target builder), see AGENTS.md.
RUN mkdir -p /app/data/media && chown -R nextjs:nodejs /app/data
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]