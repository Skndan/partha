# syntax=docker/dockerfile:1.6
# Build from monorepo root: docker build -f apps/site/Dockerfile .

FROM oven/bun:1 AS deps
WORKDIR /monorepo

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN bun install --frozen-lockfile || bun install

FROM deps AS builder
WORKDIR /monorepo/apps/site
ENV SKIP_ENV_VALIDATION=1
RUN bun run build

FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /monorepo/apps/site/.next/standalone ./
COPY --from=builder /monorepo/apps/site/.next/static ./.next/static
COPY --from=builder /monorepo/apps/site/public ./public

EXPOSE 4001

CMD ["node", "server.js"]
