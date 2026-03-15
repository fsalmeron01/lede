FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    yt-dlp \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY workers/media/package.json ./workers/media/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

COPY . .

WORKDIR /app/workers/media
CMD ["npm", "run", "start"]
