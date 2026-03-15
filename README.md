# Link-to-Transcript V1

Self-hosted V1 media processing platform for **Coolify**. Users paste a **YouTube** or **Vimeo** URL and request one or more outputs:

- MP3
- TXT transcript
- DOCX transcript

## Stack

- **Frontend/API:** Next.js 14
- **Queue:** Redis + BullMQ
- **Database:** PostgreSQL
- **Media acquisition/extraction:** yt-dlp + FFmpeg/ffprobe
- **Transcription/export:** Python + faster-whisper + python-docx
- **Deployment:** Docker Compose / Coolify

## Important note

This project is intended for content you own or are authorized to process. Make sure your usage complies with the source platform's terms and applicable rights.

## Features in V1

- Paste a YouTube or Vimeo URL
- Choose outputs: MP3 / TXT / DOCX
- Queue-based processing
- Job status page
- Local persistent storage
- Artifact download links
- Transcript viewer

## Project layout

```text
.
├── apps/web
├── workers/media
├── workers/transcribe
├── packages/shared
├── docker
├── db
├── storage
├── docker-compose.yml
└── .env.example
```

## Quick start

1. Copy `.env.example` to `.env`
2. Adjust secrets and host values
3. Start the stack:

```bash
docker compose up --build
```

4. Open:

```text
http://localhost:3000
```

## Default ports

- Web: `3000`
- Postgres: `5432`
- Redis: `6379`

## Coolify notes

Create this as a **Docker Compose** application in Coolify.

### Persistent storage
Map persistent storage for:

- `/data` in `web`
- `/data` in `media-worker`
- `/data` in `transcribe-worker`
- Postgres data volume

### Environment variables
Import values from `.env.example`.

## Pipeline flow

1. User submits URL + desired outputs
2. Web app stores job in PostgreSQL
3. Web app enqueues a media job in Redis
4. Media worker downloads media with `yt-dlp`
5. Media worker extracts MP3 with `ffmpeg`
6. Media worker enqueues transcription job
7. Python worker runs `faster-whisper`
8. Python worker writes:
   - transcript `.txt`
   - transcript `.docx`
   - transcript JSON
9. Web app exposes status and downloads

## Example API

### Create job

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "sourceUrl":"https://vimeo.com/1169892446",
    "outputs":["mp3","txt","docx"]
  }'
```

### Get job

```bash
curl http://localhost:3000/api/jobs/<job-id>
```

## Common admin tasks

### Tail logs

```bash
docker compose logs -f web
docker compose logs -f media-worker
docker compose logs -f transcribe-worker
```

### Reset everything

```bash
docker compose down -v
rm -rf ./storage/*
docker compose up --build
```

## Roadmap

- Signed download URLs
- Authentication
- S3/MinIO artifact storage
- Translation
- Speaker diarization
- GPU transcription
- WebSocket progress
