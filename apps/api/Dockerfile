# ============================================================
# NestJS Production Dockerfile (monorepo-aware)
# Build context: monorepo root (docker-compose sets context: .)
# ============================================================

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 2: Build the NestJS app ---
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# tsconfig.base.json is needed because apps/api/tsconfig.json extends it
COPY tsconfig.base.json ./
COPY libs/shared-types/ ./libs/shared-types/
COPY apps/api/ ./apps/api/

# Build shared-types first — the workspace symlink in node_modules points to
# ../../libs/shared-types, so nest build needs the compiled dist/ to exist.
RUN npx tsc -p libs/shared-types/tsconfig.lib.json

# Compile TypeScript → dist/
WORKDIR /app/apps/api
RUN npx nest build

# Remove devDependencies (typescript, @nestjs/cli, jest, etc.)
# so only production deps remain for the final image.
WORKDIR /app
RUN npm prune --omit=dev

# --- Stage 3: Production runtime ---
FROM node:20-alpine AS production

# tini: lightweight init system that forwards SIGTERM/SIGINT to Node.
# Without it, Node as PID 1 ignores shutdown signals.
RUN apk add --no-cache tini

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/dist ./dist

# Switch to the built-in non-root user (UID 1000, pre-created in node images).
USER node

EXPOSE 3000

# tini as PID 1 ensures proper signal handling + zombie reaping.
ENTRYPOINT ["/sbin/tini", "--"]

# Run compiled JS directly — not via npm (which swallows signals).
# TypeORM migrations run automatically on startup via migrationsRun: true in app.module.ts.
CMD ["node", "dist/main.js"]
