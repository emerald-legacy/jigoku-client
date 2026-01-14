FROM node:18-bookworm-slim

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        make \
        g++ \
        libzmq3-dev \
        git \
    && rm -rf /var/lib/apt/lists/*

# Verify Node version
RUN node --version && npm --version

COPY package*.json ./

# Install dependencies
# --legacy-peer-deps: needed for monk/mongodb version mismatch
RUN npm install --legacy-peer-deps

COPY . .

RUN mkdir -p server/logs public/img/cards && npm run build

RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

CMD ["./docker-entrypoint.sh"]
