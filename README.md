# BezProgu — Kraków bez barier

**Nie »dostępne«. Konkretnie.** BezProgu checks places and routes in Kraków against the user's own
needs — for wheelchair users and parents with strollers. Instead of an "accessible / not accessible"
verdict it shows concrete parameters (steps, thresholds, door width, surface, elevator, toilet,
kerbs on the route), each with its **source, date and reliability status**, matched against a needs
profile that never asks about disability.

Built for the HackYeah 2026 challenge *Kraków bez barier*. UI language: Polish.

## Features

- **Search** (`/szukaj`): text list first, map on demand; each result shows *pasuje · bariery · brak
  danych* for your profile. Places with little data rank lower and are marked *Mało danych*.
- **Place card** (`/miejsce/:id`): every parameter with source, date and one of six reliability
  statuses: *Potwierdzone, Z otwartych danych, Zgłoszenie użytkownika, Sprzeczne, Może być
  nieaktualne, Brak danych*. Conflicting sources are shown side by side; missing data is never
  treated as accessible. Change history at `/miejsce/:id/historia`.
- **Accessible routing** (`/trasa`): GraphHopper on OpenStreetMap with a wheelchair profile — steps
  always avoided, cobblestones optionally; step-by-step description with surface and kerb data.
- **Needs profile** (`/moje-potrzeby`): wheelchair / stroller presets or custom limits, stored only
  in the browser.
- **Reports** (`/zglos`): 3-step correction form, no account; visible immediately as an unverified
  user report.
- **Embeddable widget** (`/widget/:id`, demo: `/widget-demo.html`) for hotels and event sites.
- **Info pages**: data sources and reliability (`/dane`), business model (`/dla-firm`), scaling and
  maintenance (`/dla-miast`), FAQ, accessibility statement, privacy, licences.
- Mobile first, keyboard and screen-reader friendly (WCAG 2.2 AA as the target).

## Getting started

Requirements: **Docker Desktop** (with Docker Compose), at least 4 GB of memory for Docker
(Settings → Resources), internet on the first start.

### 1. Create the config (first time only)

macOS / Linux:

```bash
cp .env.example .env
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

### 2. Start everything

```bash
docker compose up --build
```

All data loads automatically; no import commands are needed. On start the backend runs migrations
and `seed_demo`, which loads (without network):

- **~1950 real places** from the committed OpenStreetMap snapshot
  (`backend/places/fixtures/osm_krakow.json`),
- **4 sample places**, all labelled *"Dane przykładowe"*. *Sukiennice (przykład)* (`/miejsce/1`)
  demonstrates every data state,
- **sample kerbs and crossings** on the demo route (Kraków Główny → Rynek).

GraphHopper downloads the Małopolska extract from Geofabrik (~200 MB) and builds its routing graph:
**about 5 minutes on the first start**, seconds afterwards (data is kept in the `gh_data` volume).
Until then `/trasa` shows *"Usługa wyznaczania tras jest chwilowo niedostępna"* — the intended
"source unavailable" state.

### 3. Check it's ready

```bash
docker compose logs backend | grep -E "Seeded|Fikstura"
```

You should see `Seeded 4 sample places` and a `Fikstura OSM: …` line.

```bash
docker compose logs graphhopper | grep "Started Server"
```

When this prints a line, routing is ready. Then open **http://localhost:5173**.

| Service | URL | What it is |
|---|---|---|
| `frontend` | http://localhost:5173 | React 19 + Vite dev server (proxies `/api` to the backend) |
| `backend` | http://localhost:8000/api/ | Django 5.2 + DRF + GeoDjango |
| `db` | `localhost:5432` | PostgreSQL 17 + PostGIS 3.5 |
| `graphhopper` | internal only (`graphhopper:8989`) | GraphHopper 10 routing engine |

### Optional

Admin account, to moderate reports and edit places at http://localhost:8000/admin/:

```bash
docker compose exec backend python manage.py createsuperuser
```

Refresh the OSM places from the latest Geofabrik extract (~10 s; the first run downloads ~200 MB):

```bash
docker compose exec backend python manage.py import_osm
```

Real kerb and crossing data instead of the demo sample. This uses the public Overpass API, which may
be slow or unreachable on some networks; if it fails, the demo data stays in place:

```bash
docker compose exec backend python manage.py import_obstacles
```

### Clean restart from scratch

Deletes the database and the routing data (GraphHopper rebuilds again, ~5 minutes):

```bash
docker compose down -v
```

```bash
docker compose up --build
```

> **Before a demo**, start the stack well ahead so GraphHopper has finished building, and don't run
> `docker compose down -v` just before presenting.

## Demo path

1. `/` → choose **Wózek** → search **Sukiennice**.
2. Open **Sukiennice (przykład)** (`/miejsce/1`): barrier (3 steps), alternative entrance, conflicting
   threshold data (2 cm vs 5 cm) with *Byłem tam, potwierdzam*, outdated toilet info, missing data.
3. *Trasa tutaj* → from **Kraków Główny**: step-free route with surface and kerb issues per step;
   toggle cobblestone avoidance to change the route.
4. *Zgłoś zmianę lub błąd* → send a report → it appears on the card and in the history.
5. `/dane` → reliability statuses and live source status (Otwarte Dane Krakowa shown as unavailable).

The script for the 3-minute video is in [docs/pitch/demo-script.md](docs/pitch/demo-script.md).

## Data

| Source | How | Default status |
|---|---|---|
| OpenStreetMap | `import_osm`: Geofabrik extract filtered locally with osmium (default) or the Overpass API | Z otwartych danych |
| Otwarte Dane Krakowa / MSIP | `import_krakow_open_data` connector; no dataset with accessibility attributes found yet, so the source shows as unavailable | Z otwartych danych |
| Facility owners | confirmation (in the prototype: admin panel) | Potwierdzone |
| Users | `/zglos`, no account | Zgłoszenie użytkownika |

Every claim is stored as an append-only **fact** (parameter, value, source, observation date), so
corrections never overwrite history. Rules for merging sources, conflicts and outdated data live in
[backend/places/matching.py](backend/places/matching.py); parameters, statuses and profile presets in
[backend/places/catalog.py](backend/places/catalog.py) (served at `/api/meta/`).

Refresh the OSM data or add another city:

```bash
# central Kraków (default bbox), ~10 s
docker compose exec backend python manage.py import_osm --dump-fixture places/fixtures/osm_krakow.json

# another area: bbox = south,west,north,east, region = Geofabrik path
docker compose exec backend python manage.py import_osm --bbox 50.04,19.91,50.075,19.965 --region europe/poland/malopolskie

# live Overpass API instead of the extract
docker compose exec backend python manage.py import_osm --via overpass

# kerbs and crossings for routing
docker compose exec backend python manage.py import_obstacles
```

## Architecture

```
Sources ─▶ Importers ─▶ Facts ─▶ Reliability evaluation ─▶ REST API ─▶ Web app · widget · partner API
(OSM, city    (one per      (places.   (matching.py: newest per       (/api/…)
 data, owners, source, with  Fact)      source, conflicts, age,
 users)        sync status)             profile match)
```

- `backend/places/` — places, facts, sources, reports, history, OSM importer, search and matching.
- `backend/routing/` — `/api/route/` (GraphHopper + kerb/crossing obstacles), `/api/geocode/` (our places, then Photon).
- `routing/` — GraphHopper image and wheelchair profile.
- `frontend/src/` — pages in `pages/`, shared components (badges, status icons, lazy map) in
  `components/`, profile and metadata hooks in `hooks/`.

The API contract is documented in [docs/API.md](docs/API.md).

## Development

```bash
docker compose exec backend python manage.py test          # backend tests (places + routing)
docker compose exec backend python manage.py makemigrations
docker compose exec frontend npx vite build                # frontend build check
docker compose exec frontend npm install <package>         # add a frontend dependency
docker compose down                                        # stop
docker compose down -v                                     # stop and delete the database and routing data
```

Code changes reload automatically (both `backend/` and `frontend/` are mounted into the containers).
After changing `package.json` or `requirements.txt`, run `docker compose up --build`.

## Troubleshooting

- **`./entrypoint.sh: 2: set: Illegal option -` (Windows)** — the checkout converted line endings to
  CRLF. Current `main` handles this (`.gitattributes` forces LF and the containers strip `\r`); pull
  and run `docker compose up --build`. To fix an existing clone's files as well:
  `git rm --cached -r . && git reset --hard` (discards uncommitted changes).
- **Port already in use** — change `DB_PORT`, `BACKEND_PORT` or `FRONTEND_PORT` in `.env`.
- **`/trasa` says the routing service is unavailable** — GraphHopper is still building its graph on
  the first start; follow it with `docker compose logs -f graphhopper`.
- **GraphHopper exits or Docker is very slow** — give Docker Desktop at least 4 GB of memory
  (Settings → Resources).
- **Map changes don't hot-reload on Windows/macOS** — Vite already uses polling; restart with
  `docker compose restart frontend`.

## Project documents

- [docs/pitch/](docs/pitch/) — presentation (`BezProgu-prezentacja.pptx` / `.pdf`), demo script, submission text
- [docs/SPEC.md](docs/SPEC.md) — challenge requirements and page-by-page product spec
- [docs/API.md](docs/API.md) — API contract
- [AGENTS.md](AGENTS.md) — conventions and product rules for contributors and coding agents
- [docs/PLAN.md](docs/PLAN.md), [docs/agents/](docs/agents/) — how the prototype was built with parallel agents

## Licences

Code: open source components — Django (BSD), Django REST framework (BSD), PostGIS (GPL), React (MIT),
Leaflet (BSD-2), GraphHopper (Apache 2.0). Map and place data © OpenStreetMap contributors, ODbL 1.0.
Sample places are fictional and labelled "Dane przykładowe".
