# Build stage
FROM node:24.14-alpine3.23 AS builder

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

ARG BUILD_VERSION=LOCAL
ENV BUILD_VERSION=$BUILD_VERSION

# Build client bundle and remove dev dependencies
RUN mkdir -p server/logs public/img/cards && npm run build && npm prune --omit=dev

# Production stage
FROM node:24.14-alpine3.23


WORKDIR /app

# Copy pruned node_modules and built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/views ./views
COPY --from=builder /app/config ./config
COPY --from=builder /app/package.json ./
COPY --from=builder /app/index.js ./
COPY --from=builder /app/version.js ./
COPY --from=builder /app/docker-entrypoint.sh ./
COPY --from=builder /app/client/GameModes.js ./client/
COPY --from=builder /app/client/deck-validator.js ./client/

RUN mkdir -p server/logs public/img/cards && chmod +x docker-entrypoint.sh \
    && chown -R node:node /app

ARG BUILD_VERSION=LOCAL
ENV NODE_ENV=production
ENV BUILD_VERSION=$BUILD_VERSION
ENV PORT=4000

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

CMD ["./docker-entrypoint.sh"]
