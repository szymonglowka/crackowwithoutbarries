# API contract

Base path `/api/`. JSON. Status legend: ✅ implemented (foundation) · 🔨 to build (owner in brackets).
Rules: never remove or rename fields; adding fields is fine. Dates are ISO `YYYY-MM-DD`.

## Profile query params

Any endpoint that evaluates places/routes accepts the user's profile as query params
(all optional — an absent field means "no constraint"). Booleans: `1`/`0`.

`max_steps`, `max_threshold_cm`, `min_door_width_cm`, `max_incline_pct`, `needs_elevator`,
`needs_accessible_toilet`, `needs_changing_table`, `needs_seating`, `avoid_cobblestone`

Frontend: pass `useProfile()[0].values` straight in.

## ✅ GET /api/meta/

Catalog: `groups`, `parameters` (`key, group, label, type, unit?, choices?`), `categories`,
`reliability` (key/label/description), `match`, `profile_fields`, `profile_presets`
(`wheelchair`, `stroller` → `{label, values}`).

## ✅ GET /api/sources/

```json
[{"key": "osm", "name": "OpenStreetMap", "url": "...", "license": "ODbL 1.0",
  "default_reliability": "open_data", "refresh_policy": "co 24 h (Overpass API)",
  "status": "ok" | "unavailable", "last_sync_at": "2026-10-03T12:00:00Z", "last_error": ""}]
```

## ✅ GET /api/places/?q=&category=&<profile>

`category` may be comma-separated. Response:

```json
{"count": 4, "results": [{
  "id": 1, "name": "Sukiennice (przykład)", "category": "museum", "category_label": "Muzea",
  "address": "Rynek Główny 1, Kraków", "lat": 50.0617, "lon": 19.9373, "is_sample": true,
  "summary": {"match": 4, "barrier": 3, "unknown": 1, "confirmed": 4},
  "low_data": false,
  "top_fact": {"label": "Stopnie przy wejściu głównym", "value_display": "3 szt.",
               "match": "barrier", "status": "confirmed", "observed_at": "2026-09-13"}
}]}
```

- `summary.unknown` counts only parameters the profile cares about with no data.
- `summary.confirmed` = number of parameters with status `confirmed` (for "best documented" sort).
- `low_data: true` → show "Mało danych: oceń ostrożnie".

🔨 [A1] extra params: `near=lat,lon` (adds `distance_m` to each result),
`ordering=match|distance|documented` (default `match`: fewest barriers, then most matches),
`bbox=minLon,minLat,maxLon,maxLat`.

## ✅ GET /api/places/:id/?<profile>

```json
{
  "id": 1, "name": "...", "category": "museum", "category_label": "Muzea", "address": "...",
  "lat": 50.06, "lon": 19.93, "is_sample": true,
  "phone": "+48 ...", "website": "https://...", "osm_url": "https://www.openstreetmap.org/node/123" | null,
  "key_note": "Wejście główne ma 3 stopnie. Użyj windy od ul. Szewskiej.",
  "summary": {"match": 4, "barrier": 3, "unknown": 1, "confirmed": 4},
  "last_changed": "2026-09-23",
  "sources": [ <source objects as in /api/sources/> ],
  "groups": [{
    "key": "entrance", "label": "Dojście i wejście",
    "parameters": [{
      "key": "threshold_cm", "label": "Wysokość progu", "unit": "cm",
      "value": 2, "value_display": "2 cm",
      "status": "confirmed|open_data|user_report|conflicting|outdated|missing",
      "match": "match|barrier|unknown|info",
      "requirement": "Twoje maksimum: 2 cm",
      "sources": [{
        "value": 2, "value_display": "2 cm",
        "source": {"key": "osm", "name": "OpenStreetMap"},
        "reliability": "open_data", "observed_at": "2026-03-17",
        "outdated": false, "is_sample": true, "note": ""
      }]
    }]
  }]
}
```

- `sources[]` = newest fact per source, most reliable first. `sources[0]` is the displayed value.
- `status: "conflicting"` → show ALL `sources` side by side + "Byłem tam, potwierdzam".
- `status: "missing"` → `value: null`, `sources: []`. `match: "info"` = profile doesn't care.
- A group whose parameters contain a `barrier` should be expanded by default.

## 🔨 GET /api/places/:id/history/  [A1]

Chronological (newest first) list of every fact for the place:

```json
[{"date": "2026-09-23", "parameter": "threshold_cm", "label": "Wysokość progu",
  "old_value_display": "2 cm" | null, "new_value_display": "5 cm",
  "source": {"key": "user", "name": "Zgłoszenie użytkownika"},
  "reliability": "user_report", "is_sample": true, "note": "..."}]
```

`old_value_display` = previous value of the same parameter (any source), `null` for the first.

## 🔨 POST /api/reports/  [A1 backend, A4 frontend]

Create a user report (no account). Also used by "Byłem tam, potwierdzam" (send current value).

Request:
```json
{"place": 1, "parameter": "threshold_cm", "value": 5, "comment": "optional",
 "observed_at": "2026-10-03", "email": "optional@example.com", "website": ""}
```
`website` is a honeypot — must be empty (bots fill it). Throttled per IP.

- `201` → `{"id": 7, "status": "pending", "fact_id": 42}` — the report immediately appears on the
  place card as a `user_report` fact.
- `400` → `{"<field>": ["Polish error message"]}` (DRF format) — show next to the field + summary.

## 🔨 GET /api/route/?from=lat,lon&to=lat,lon&avoid=&<profile>  [A2]

`avoid` (comma-separated): `cobblestone`, `high_kerbs`, `steep`, `no_data`, `steps` (always on).

```json
{
  "routes": [{
    "id": "main" | "alt-1",
    "distance_m": 900, "duration_s": 900,
    "summary": {"steps": 0, "difficult_surface": 1, "unknown": 1, "barriers": 0},
    "summary_text": "900 m, ok. 15 min · bez schodów · 1 odcinek trudnej nawierzchni · 1 przejście bez danych",
    "geometry": [[50.06, 19.93], ...],
    "steps": [{
      "index": 1, "instruction": "Skręć w prawo w ul. Floriańską",
      "distance_m": 120, "geometry": [[lat, lon], ...],
      "surface": "sett", "surface_display": "kostka brukowa",
      "incline_pct": 2.5,
      "issues": [{"type": "kerb|surface|incline|steps|crossing",
                  "match": "barrier|unknown|match",
                  "text": "Brak danych o krawężniku. Nie wiemy, czy jest obniżony.",
                  "source": {"key": "osm", "name": "OpenStreetMap"}, "observed_at": "2026-05-01" | null}]
    }]
  }],
  "data_source": {"key": "osm", "name": "OpenStreetMap", "last_sync_at": "..."}
}
```
- `503` → `{"detail": "Usługa wyznaczania tras jest chwilowo niedostępna."}` (GraphHopper down).
- `404` → `{"detail": "Nie znaleźliśmy trasy bez barier między tymi punktami."}`

## 🔨 GET /api/geocode/?q=  [A2]

```json
[{"label": "Dworzec Główny, Kraków", "lat": 50.067, "lon": 19.947, "place_id": 3 | null}]
```
Searches our places first, then Nominatim/Photon limited to Kraków.
