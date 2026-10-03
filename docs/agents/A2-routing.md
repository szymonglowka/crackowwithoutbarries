# A2 — Accessible routing (full stack)

Branch `agent/a2-routing`. You own `backend/routing/**`, `routing/**`, new services in
`docker-compose.yml`, `frontend/src/pages/RoutePlanner.*`, `frontend/src/components/route/**`,
`frontend/src/api/route.js`. Read `AGENTS.md` and `docs/API.md` (#route, #geocode) first.

Goal: real pedestrian routing from OpenStreetMap that avoids steps and respects the user's profile,
with a **step-by-step text description** showing surface, kerbs, incline and missing data per step.

## 1. GraphHopper service (do first, verify early — it's the riskiest part)
- Add service `graphhopper` to `docker-compose.yml`. Build your own image in `routing/Dockerfile`
  from `eclipse-temurin:21-jre` + the official `graphhopper-web-<ver>.jar` from GitHub releases
  (works on Apple Silicon and x86; third-party images are often amd64-only).
- OSM data: Geofabrik `https://download.geofabrik.de/europe/poland/malopolskie-latest.osm.pbf`.
  Download in an entrypoint script into a named volume only if missing (do NOT commit the .pbf).
  Optionally clip to Kraków with osmium to speed up import.
- `routing/config.yml`: profile(s) for walking with wheelchair constraints. Check the
  `config-example.yml` and `custom_models/` shipped with that GraphHopper release — use the built-in
  wheelchair custom model if it exists, otherwise a foot-based custom model that excludes
  `highway=steps` and penalises bad `surface`/`smoothness`. Enable elevation (`srtm`) if it works
  quickly — gives `average_slope`. Don't use CH-only preparation: we send per-request custom models
  (use LM or no preparation; the area is small).
- Healthcheck in compose; backend `depends_on` is NOT required (routing may be down — that's a demo case).
- Graph import may take minutes on first start; document that in README.

## 2. Backend `/api/route/` + `/api/geocode/` (contract in `docs/API.md` — follow it exactly)
- Translate profile + `avoid` into a GraphHopper `custom_model` per request:
  `avoid_cobblestone`/`cobblestone` → strongly penalise `surface in (sett, cobblestone, unhewn_cobblestone, gravel)`;
  `max_incline_pct`/`steep` → penalise `average_slope` above threshold; steps always excluded.
- Request `details`: `surface`, `smoothness`, `average_slope` (if elevation), `road_class`, `street_name`;
  `locale=pl`, `instructions=true`, `points_encoded=false`, `algorithm=alternative_route` (max 2).
- Merge GH instructions with path details by point interval → `steps[]` with `surface_display`
  (Polish labels, reuse `places.catalog` enum labels where they overlap) and `issues[]`.
- Kerbs & crossings: GraphHopper doesn't tell you kerb heights. Import `barrier=kerb` and
  `highway=crossing` nodes (with `kerb=*`, `kerb:height`, `tactile_paving`) for the Kraków bbox via
  Overpass into your own model `routing.Obstacle` (PointField, tags JSON, osm_id, observed_at), command
  `import_obstacles`, + committed fixture for offline demo. For each step, find obstacles within ~8 m
  of the step geometry (PostGIS `dwithin` on geography). Crossing without kerb info →
  issue `match: "unknown"`, text "Brak danych o krawężniku. Nie wiemy, czy jest obniżony."
  `kerb=raised` or height > profile `max_threshold_cm` → `barrier`. `kerb=lowered|flush` → `match`.
- Summary text exactly in the contract style: "900 m, ok. 15 min · bez schodów · 1 odcinek trudnej
  nawierzchni · 1 przejście bez danych". Walking speed for wheelchair/stroller ≈ 3.6 km/h → recompute duration.
- GH unreachable → 503 with the Polish message (this is a required "source unavailable" demo case).
- Geocode: our `places.Place` by name first, then Photon (`https://photon.komoot.io/api/?q=&bbox=19.79,49.97,20.22,50.13`, no `lang` param) or Nominatim (`viewbox` Kraków, `bounded=1`, User-Agent header, ≤1 req/s, cache results).
- Write a couple of tests with mocked GH responses.

## 3. Frontend `/trasa` (mobile-first, see spec section "4. Trasa")
- Form: "Skąd" (with "Moja lokalizacja" button — ask for geolocation only on click) and "Dokąd",
  each an accessible combobox/autocomplete over `/api/geocode/` (or a simple input + results list
  of buttons — simpler and fully accessible; prefer that). "Zamień" button between. `ProfileChip`.
  Collapsible "Unikaj" (`<details>`) with checkboxes: kostka brukowa, wysokie krawężniki,
  strome podjazdy, odcinki bez danych. "Wyznacz trasę" full width.
- Support deep links: `/trasa?from=lat,lon&to=lat,lon` and `?toPlace=<id>` (A3's place card links here).
- Result: summary line; toggle "Opis / Mapa" (`aria-pressed`, default Opis); numbered `<ol>` of steps,
  each with instruction, surface, issues (use `MatchBadge`, source + date); steps with problems have
  an icon + border. Alternative route card "Dłuższa o 300 m, ale omija kostkę" + "Pokaż".
  Map via `LazyMap` with `lines` + markers for issues; note "Te same informacje są w opisie".
  Desktop (≥1024px): form + description left, map right; highlighting step ↔ segment is a stretch.
- States: loading skeleton, 404 no route, 503 service down (clear Polish message, suggest calling
  the venue / trying later), offline.
- Stretch: "Rozpocznij" step-by-step mode (one step per screen, big text, Poprzedni/Następny).

## Demo route (must work)
Kraków Główny (Dworzec) → Rynek Główny / Sukiennice, wheelchair profile, with cobblestone avoidance on/off
showing a different route or at least a different summary. Make sure at least one step shows a
"Brak danych" crossing.
