#!/bin/sh
set -e
python manage.py migrate --noinput
python manage.py seed_demo
python manage.py loaddata obstacles_demo  # sample kerbs/crossings on the demo route (routing app)
exec "$@"
