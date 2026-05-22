#!/bin/sh
set -e

python manage.py migrate --noinput

if [ "${LOAD_TEST_DATA:-true}" = "true" ]; then
  python create_test_data.py
fi

python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-2}"
