# BezProgu — Kraków bez barier

Checks places and routes in Kraków against **your** needs (wheelchair, stroller). It shows concrete
barriers and amenities, each with its source, date and reliability, instead of "accessible / not accessible".

Stack: Django 5.2 + DRF + GeoDjango/PostGIS · React 19 + Vite + Leaflet · Docker Compose.

## Getting started

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api/ (`/meta/`, `/sources/`, `/places/`) |
| Admin | http://localhost:8000/admin/ (`docker compose exec backend python manage.py createsuperuser`) |
| PostGIS | `localhost:5432` |

On start the backend runs migrations and `seed_demo`, which adds clearly labelled sample places.

## Docs

- [AGENTS.md](AGENTS.md): conventions, ownership, product rules (read by coding agents)
- [docs/SPEC.md](docs/SPEC.md): challenge requirements and page-by-page product spec
- [docs/API.md](docs/API.md): API contract
- [docs/PLAN.md](docs/PLAN.md): parallel work plan
