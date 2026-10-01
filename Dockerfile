# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-alpine

# --- deps ---
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN npm i -g pnpm@10.33.2
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# --- builder ---
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN npm i -g pnpm@10.33.2
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
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
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]