# A1 — Data & API (backend)

Branch `agent/a1-data`. You own `backend/places/**`. Read `AGENTS.md` and `docs/API.md` first.
The foundation already has models (`Source`, `Place`, `Fact`), matching, `/api/meta/`,
`/api/sources/`, `/api/places/` list + detail, and `seed_demo`. Keep all those responses compatible.

Data is 15% of the score: "where does each fact come from, when, how reliable, how it's updated".

## Tasks, in priority order

### 1. Reports + history (A4 and A3 are waiting for these, so do them first)
- `Report` model: place, parameter, value (JSON), comment, observed_at, email (optional), status
  (`pending|accepted|rejected`), created_at, ip_hash (sha256 of IP + SECRET_KEY, never raw IP), fact FK.
- `POST /api/reports/` exactly as in `docs/API.md`. Validate: parameter exists in catalog, value type
  matches the parameter type (int/number/bool/enum choice), observed_at not in the future.
  Honeypot `website` must be empty (return 201 but drop it silently). DRF `AnonRateThrottle` e.g. 20/hour.
  Creates a `Fact` with source `user`, reliability `user_report`. Polish error messages.
- `GET /api/places/:id/history/` as in the contract.
- Tests for the report endpoint and `matching.py` (conflict, outdated, missing, irrelevant-missing).

### 2. OpenStreetMap importer — `python manage.py import_osm`
- Overpass API (`https://overpass-api.de/api/interpreter`), bbox for central Kraków
  (Stare Miasto, Kazimierz, Podgórze, Kleparz, Dworzec: roughly `50.040,19.910,50.075,19.965`).
  Make the bbox/area a CLI option so "add another city" = different argument (scalability story).
- Fetch POIs with `name` and any of: `tourism=museum|hotel|hostel|guest_house|attraction`,
  `amenity=restaurant|cafe|fast_food|toilets|cinema|theatre|townhall|library|place_of_worship`,
  `shop=mall`, `railway=station`, `office=government`. Use `out center tags;`.
- Map OSM tags → facts (source `osm`, reliability `open_data`, `observed_at` = OSM element
  timestamp — use `out meta` to get it). Keep the mapping in one dict, it's a slide in the pitch:
  - `wheelchair=yes` → `step_free_entrance=True`; `wheelchair=no` → `step_free_entrance=False`;
    `wheelchair=limited` → `step_free_entrance=False` + note "OSM: ograniczona dostępność".
    `wheelchair:description` → `Place.key_note` if empty.
  - `toilets:wheelchair` → `accessible_toilet`; `changing_table` → `changing_table`;
    `ramp`/`ramp:wheelchair` → `ramp`; `door:width`/`width` on entrance → `door_width_cm`;
    `step_count` on entrance → `entrance_steps`; `kerb:height` → `threshold_cm`;
    `automatic_door` → `automatic_door`; `elevator`/`highway=elevator` nearby → `elevator` (optional);
    `surface` → `approach_surface` (map to our enum, ignore unknown).
  - Bonus: fetch `entrance=*` nodes inside building ways and attach their tags to the POI.
- Category from tags → our `CATEGORIES`. Address from `addr:street` + `addr:housenumber`.
- Upsert by (`osm_type`, `osm_id`). Only add a new `Fact` when the value changed
  (append-only history). Cache the raw Overpass response in a file so re-runs work offline.
- On HTTP error/timeout: set `Source(osm).status="unavailable"`, `last_error`, keep existing data,
  exit non-zero. On success: `status="ok"`, `last_sync_at=now`.
- Run once and commit a fixture (`places/fixtures/osm_krakow.json`, `dumpdata`) so the demo
  works without network; `seed_demo` should load it if present. Target: a few hundred places.

### 3. Search improvements
- `near=lat,lon` → `distance_m` (PostGIS `Distance`), `ordering=match|distance|documented`, `bbox=`.
- `q` should also match category labels ("muzeum") and be accent-insensitive if cheap
  (`unaccent` extension via migration + `__unaccent__icontains`).

### 4. Data demo scenarios (they're required in the jury demo — keep them in `seed_demo`)
Already seeded: conflict (Sukiennice `threshold_cm`), outdated (Sukiennice toilet), missing data,
user report, and `krakow_open_data` source status `unavailable`. Make sure each one shows correctly via the API.
Add an "owner confirmation" example (`owner` source) on at least one real OSM place,
marked `is_sample=True`.

### 5. Stretch
- Otwarte Dane Kraków importer (`import_krakow_open_data`): find one real dataset with
  accessibility info (e.g. public toilets, municipal offices) on otwartedane.um.krakow.pl or
  dane.gov.pl; if none is usable within 30 min, implement the command skeleton + document
  the dataset URL in the docstring and leave the source in `unavailable` state (that's the demo).
- `POST /api/places/:id/confirm/` (owner confirmation) — protected by a simple token in settings.
- Moderation in Django admin: actions "accept"/"reject" on `Report` (accept → fact reliability stays
  `user_report` but marks report accepted; 2+ matching user reports → show as more trustworthy in notes).

## Done when
- `curl` examples from `docs/API.md` all work; `python manage.py test places` passes.
- `docker compose down -v && docker compose up` gives a working DB with OSM + sample data, without network.
