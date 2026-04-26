# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package*.json ./
COPY client/package*.json ./client/
COPY shared/ ./shared/

RUN npm ci --workspace=client --ignore-scripts

COPY client/src ./client/src
COPY client/index.html ./client/
COPY client/tsconfig*.json ./client/
COPY client/vite.config.ts ./client/
COPY client/postcss.config.js ./client/
COPY client/tailwind.config.js ./client/

RUN npm run build -w client

# ── Production stage ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/nginx-health || exit 1
