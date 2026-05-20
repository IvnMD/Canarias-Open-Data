FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copiamos la app
COPY src/ ./src/
COPY run.py .

ENV FLASK_RUN_HOST=0.0.0.0 \
    FLASK_RUN_PORT=5000

EXPOSE 5000

CMD ["python", "run.py"]
