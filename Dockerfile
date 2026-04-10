FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

COPY requirements.txt requirements-cloudrun.txt ./

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements-cloudrun.txt

COPY cloudrun ./cloudrun
COPY model ./model
COPY scripts ./scripts
COPY frontend/public/data ./frontend/public/data

EXPOSE 8080

CMD ["gunicorn", "--bind", ":8080", "--workers", "1", "--threads", "8", "--timeout", "240", "cloudrun.live_data_service:app"]
