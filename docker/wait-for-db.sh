#!/bin/sh
# Ждём PostgreSQL в контейнере db (образ подтягивается при docker compose up)
set -e

host="${DB_HOST:-db}"
port="${DB_PORT:-5432}"
user="${DB_USER:-postgres}"
max_attempts="${DB_WAIT_ATTEMPTS:-60}"

echo "Ожидание PostgreSQL (${host}:${port})..."

attempt=0
until pg_isready -h "$host" -p "$port" -U "$user" -q; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "PostgreSQL не ответил за ${max_attempts} попыток." >&2
    exit 1
  fi
  sleep 1
done

echo "PostgreSQL готов."
