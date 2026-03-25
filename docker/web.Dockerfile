FROM node:20-bookworm-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

COPY . .

WORKDIR /app/apps/web
RUN npm run build 2>&1 || (echo '=== BUILD FAILED ===' && cat .next/build-manifest.json 2>/dev/null || true && false)

WORKDIR /app
RUN chmod +x /app/docker/entrypoint.sh

EXPOSE 3000
CMD ["/app/docker/entrypoint.sh"]
