# syntax=docker/dockerfile:1.6
# Build from monorepo root: docker build -f apps/docs/Dockerfile .

FROM oven/bun:1 AS deps
WORKDIR /monorepo

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN bun install --frozen-lockfile || bun install

FROM deps AS builder
WORKDIR /monorepo/apps/docs
ENV SKIP_ENV_VALIDATION=1
RUN bun run build

FROM node:20-slim AS runner
WORKDIR /app

ARG VERSION=0.0.0
ARG REVISION=unknown
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.revision="${REVISION}"

ENV NODE_ENV=production
ENV PORT=4002
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /monorepo/apps/docs/.next/standalone ./
COPY --from=builder /monorepo/apps/docs/.next/static ./.next/static
COPY --from=builder /monorepo/apps/docs/public ./public

EXPOSE 4002

CMD ["node", "server.js"]
