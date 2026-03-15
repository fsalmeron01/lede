FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    gcc \
    build-essential \
    libsndfile1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY workers/transcribe/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY workers/transcribe ./workers/transcribe

WORKDIR /app/workers/transcribe
CMD ["python", "worker.py"]
