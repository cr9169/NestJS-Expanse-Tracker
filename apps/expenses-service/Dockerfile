# ─────────────────────────────────────────────────────────────────────────────
# ARCHITECTURE NOTE:
# Multi-stage build: the "builder" stage contains all dev tooling and compiles
# TypeScript. The "production" stage copies only the compiled JS and prod deps,
# keeping the final image minimal (~50% smaller). The non-root user "node"
# prevents container breakout vulnerabilities.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first to leverage Docker layer caching.
# Dependencies are only reinstalled if package.json files change.
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/expenses-service/package*.json ./apps/expenses-service/

# Install all deps (including devDeps needed for compilation)
RUN npm ci --workspaces --if-present

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/expenses-service/ ./apps/expenses-service/

# Build shared first, then the service
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/expenses-service

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Create data directory for SQLite with correct permissions
RUN mkdir -p /data && chown node:node /data

# Copy only what production needs
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/expenses-service/dist ./apps/expenses-service/dist
COPY --from=builder /app/apps/expenses-service/package.json ./apps/expenses-service/
COPY --from=builder /app/package.json ./

# Install production-only deps
RUN npm ci --omit=dev --workspaces --if-present

# Run as non-root
USER node

EXPOSE 3001

CMD ["node", "apps/expenses-service/dist/main.js"]
