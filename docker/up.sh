#!/bin/sh
# Скачивает образ PostgreSQL (если ещё нет) и запускает весь стек
set -e
cd "$(dirname "$0")/.."

echo "Проверка образа PostgreSQL..."
docker compose pull db

echo "Запуск проекта..."
exec docker compose up --build "$@"
