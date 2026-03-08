FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update -o Acquire::Check-Valid-Until=false \
    -o Acquire::Check-Date=false \
    && apt-get install -y gcc g++ libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]