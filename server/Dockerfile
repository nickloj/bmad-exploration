# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/ ./shared/

# Install only server workspace deps
RUN npm ci --workspace=server --ignore-scripts

# Copy source and compile
COPY server/src ./server/src
COPY server/tsconfig.json ./server/

RUN npm run build:ts -w server

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:24-alpine AS production

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy compiled output and manifest
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./

# Production deps only (no devDependencies)
RUN npm ci --omit=dev --ignore-scripts

# Data directory owned by non-root user
RUN mkdir -p data && chown app:app data

USER app

EXPOSE 3000

ENV PORT=3000 \
    DB_PATH=/app/data/todos.db \
    CORS_ORIGIN=http://localhost:5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node_modules/.bin/fastify", "start", "-l", "info", "-o", "dist/src/app.js"]
