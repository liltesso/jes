FROM python:3.11-alpine AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build

RUN apk add --no-cache gcc musl-dev libffi-dev postgresql-dev cargo rust

COPY requirements.txt ./

RUN python -m pip install --upgrade pip setuptools wheel \
    && pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt


FROM python:3.11-alpine AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=3000

WORKDIR /app

RUN apk add --no-cache libpq libffi \
    && addgroup -S app \
    && adduser -S -G app -u 10001 app

COPY --from=builder /wheels /wheels
COPY requirements.txt ./

RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels

COPY --chown=app:app bot.py ./
COPY --chown=app:app public/ ./public/

RUN mkdir -p /app/public/uploads && chown -R app:app /app

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:3000/', timeout=3)" || exit 1

CMD ["python", "bot.py"]
