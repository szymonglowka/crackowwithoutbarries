# BezProgu — Kraków bez barier (hackathon)

Accessibility checker for places and routes in Kraków, for **wheelchair users and parents with strollers**.
Instead of "accessible / not accessible" we show concrete parameters (steps, thresholds, door width,
surface, elevator, toilet…), each with **source, date and reliability status**, matched against the
user's own needs profile.

**Priority: a working demo, fast.** Prefer simple, working code over abstractions. Hackathon rules apply.

## Run

```bash
cp .env.example .env        # first time only
docker compose up --build   # db :5432, backend :8000, frontend :5173
```

- Backend runs `migrate` + `seed_demo` on start. Django code reloads automatically.
- Frontend: Vite dev server, `/api` is proxied to the backend. Use relative URLs (`/api/...`).
- New npm package: `docker compose exec frontend npm install <pkg>` (commit package.json + lock).
- New pip package: add to `backend/requirements.txt`, then `docker compose up --build backend`.
- Django commands: `docker compose exec backend python manage.py <cmd>`.

## Read before coding

- `docs/API.md` — API contract. **Do not change existing response fields**; adding fields is fine.
- `docs/agents/<your-id>.md` — your task brief.
- `backend/places/catalog.py` — parameters, statuses, profile presets (exposed via `/api/meta/`).
- `backend/places/matching.py` — how facts are evaluated against a profile.

## Ownership (parallel agents — stay in your lane)

| Agent | Owns (may edit freely) |
|---|---|
| A1 data & API | `backend/places/**` (models, migrations, importers, views, tests), `backend/config/settings.py` (only additions) |
| A2 routing | `backend/routing/**`, `routing/**` (GraphHopper config/data), `docker-compose.yml` (only adding services), `frontend/src/pages/RoutePlanner.*`, `frontend/src/components/route/**`, `frontend/src/api/route.js` |
| A3 search & place | `frontend/src/pages/{Search,Place,PlaceHistory,Widget}.*`, `frontend/src/components/place/**`, `frontend/src/components/map/**`, `frontend/src/api/places.js` |
| A4 profile, report, content | all other `frontend/src/pages/*`, `frontend/src/components/content/**`, `frontend/src/components/needs/**`, `frontend/src/components/report/**`, `frontend/src/api/reports.js`, `docs/pitch/**` |

Shared, **edit only if unavoidable and keep the change minimal & additive**: `frontend/src/App.jsx`
(all routes are already registered), `frontend/src/components/*.jsx`, `frontend/src/components/layout/**`,
`frontend/src/hooks/**`, `frontend/src/styles/**`, `backend/places/catalog.py`, `docs/API.md`.
Need something from another agent's area? Code against the contract in `docs/API.md` and mock
locally if the endpoint isn't there yet — don't implement it yourself.

Each agent works on its own branch `agent/<id>` (e.g. `agent/a3-search`), commits often, and
rebases on `main` before merging. Only A1 creates migrations in `places`; only A2 in `routing`.

## Product rules (non-negotiable — they are judged)

1. Never show the word "dostępne" as a verdict. Show parameters + match: **Pasuje / Bariera / Brak danych**.
2. **Missing data is never shown as accessible.** Unknown is its own visible state.
3. Every fact shows **source, date (observed/confirmed), reliability status** — use `ReliabilityBadge`.
4. Statuses: Potwierdzone, Z otwartych danych, Zgłoszenie użytkownika, Sprzeczne, Może być nieaktualne,
   Brak danych. User reports are visibly different from confirmed data.
5. Sample/fictional data is always labelled "Dane przykładowe" (`is_sample` → `SampleBadge`).
6. We never ask about disability — only about barriers (profile lives in localStorage).
7. All UI text in **Polish**.

## Frontend conventions

- React 19 + Vite + react-router 7, plain CSS. Mobile-first: base styles for 360 px,
  then `@media (min-width: 600px)` and `(min-width: 1024px)`. One CSS file per page/component,
  next to it (`Search.jsx` + `Search.css`). Use tokens from `src/styles/tokens.css` and the
  classes in `src/styles/base.css` (`.container .page .btn .btn--primary .field .card .badge .notice`).
- Every page: `useDocumentTitle('…')`, exactly one `<h1>`, wrap content in `<div className="container page">`.
- Shared building blocks — reuse, don't duplicate:
  - `components/Badges.jsx`: `ReliabilityBadge`, `MatchBadge`, `MatchSummary`, `SampleBadge`, `formatDate`, `plural`
  - `components/StatusIcon.jsx`: shape-coded icons (status never by colour alone)
  - `components/PageStates.jsx`: `Loading`, `ErrorState`, `Empty`
  - `components/ProfileChip.jsx`, `hooks/useProfile.js` (`profile.values` = query params for matching)
  - `hooks/useMeta.js`: labels/parameters/presets from `/api/meta/`
  - `components/map/index.js`: `LazyMap` (Leaflet, code-split; wrap in `<Suspense>`)
- Accessibility (WCAG 2.2 AA target): everything works with keyboard only; visible focus (global
  style exists); 48×48 px tap targets; labels above inputs; `aria-live` for result counts and form
  confirmations; error summary that receives focus; `aria-pressed` for toggle buttons; native
  `<details>/<summary>` for accordions; every map has the same information as text next to it.

## Backend conventions

- Django 5.2 + DRF + GeoDjango (PostGIS, SRID 4326). Function views or ViewSets, plain dict responses are fine.
- Facts are append-only (`places.Fact`): corrections add a new fact, never edit old ones.
- Every importer owns one `Source` row and updates `status`, `last_sync_at`, `last_error`.
  On failure keep old data and set `status="unavailable"` — never delete data because a source is down.
- Respect external API terms: send a descriptive `User-Agent`, cache responses, no hammering
  (Overpass, Nominatim: max 1 req/s).

## Your own stack (parallel worktrees)

Each agent works in its own git worktree with its own `.env` (already set up) that gives it an
isolated Docker stack — own DB, own ports. Check `.env` for your ports:

| Agent | Frontend | Backend | DB |
|---|---|---|---|
| main | 5173 | 8000 | 5432 |
| A1 | 5174 | 8001 | 5433 |
| A2 | 5175 | 8002 | 5434 |
| A3 | 5176 | 8003 | 5435 |
| A4 | 5177 | 8004 | 5436 |

`docker compose ...` run from your worktree only touches your stack. Never run `docker compose down -v`
outside your worktree. For a quick frontend build check without Docker: `cd frontend && npx vite build`
(node_modules is installed on the host in each worktree).

## Definition of done (check before every merge)

- `cd frontend && npx vite build` passes (then `rm -rf dist`).
- `docker compose exec backend python manage.py check` passes; migrations committed.
- You clicked through your pages in the browser at 375 px and ≥1024 px, using only the keyboard.
- No console errors. No hardcoded `localhost:8000` in frontend code.
