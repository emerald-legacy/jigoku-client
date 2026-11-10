# Build stage
FROM node:26.13-alpine3.23@sha256:44a3247313f9bc069a4ec25d01b66254ed7dc4d0408727d8720dc827f0753423 AS builder

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
FROM node:26.13-alpine3.23@sha256:44a3247313f9bc069a4ec25d01b66254ed7dc4d0408727d8720dc827f0753423


WORKDIR /app

# Copy pruned node_modules and built artifacts. --chown sets the owner while copying, so the
# files aren't copied again into a chown layer. Files from the build context (config, views,
# token art) keep their host permissions, which may be owner-only, so the node user must own them.
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/views ./views
COPY --from=builder --chown=node:node /app/config ./config
COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node --chmod=755 /app/docker-entrypoint.sh ./

# public/img/cards is a named volume at runtime, which hides whatever the image ships
# there. Keep the repo's token art outside it for the entrypoint to sync in.
COPY --from=builder --chown=node:node /app/public/img/cards ./token-images

RUN mkdir -p build/server/logs public/img/cards && chown node:node build/server/logs public/img/cards

ARG BUILD_VERSION=LOCAL
ENV NODE_ENV=production
ENV BUILD_VERSION=$BUILD_VERSION
ENV PORT=4000

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:4000/health || exit 1

CMD ["./docker-entrypoint.sh"]
