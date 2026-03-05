FROM python:3.11-slim

# Install ffmpeg for video processing
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
ENV PORT=8000
# Render injects PORT; use it for compatibility
CMD ["sh", "-c", "exec python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
