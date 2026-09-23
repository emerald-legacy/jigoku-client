# Build stage
FROM node:26.9-alpine3.23@sha256:9dac39bfd053b458593c44a099d2667994c8fa9e1a8c10bc7ff2f3d97b62412d AS builder

WORKDIR /app

# Suppress npm's "new major version available" notice — the node image pins npm
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

ARG BUILD_VERSION=LOCAL
ENV BUILD_VERSION=$BUILD_VERSION
# Set by the deploy workflow; empty for local builds
ARG CI
ENV CI=$CI

# Build server (tsc) and client bundle (vite), then remove dev dependencies.
# CI images don't ship the sourcemaps: nothing uses them and express.static would serve them.
RUN mkdir -p server/logs public/img/cards && npm run build:all && npm prune --omit=dev \
    && if [ -n "$CI" ]; then find public -name '*.map' -delete; fi

# Production stage
FROM node:26.9-alpine3.23@sha256:9dac39bfd053b458593c44a099d2667994c8fa9e1a8c10bc7ff2f3d97b62412d


WORKDIR /app

# Copy pruned node_modules and built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/build ./build
COPY --from=builder /app/views ./views
COPY --from=builder /app/config ./config
COPY --from=builder /app/package.json ./
COPY --from=builder /app/docker-entrypoint.sh ./

# public/img/cards is a named volume at runtime, which hides whatever the image ships
# there. Keep the repo's token art outside it for the entrypoint to sync in.
COPY --from=builder /app/public/img/cards ./token-images

RUN mkdir -p build/server/logs public/img/cards && chmod +x docker-entrypoint.sh \
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
