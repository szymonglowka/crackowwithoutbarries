# A2 — DONE (routing)

## Co działa (zweryfikowane na stacku A2: frontend :5175, backend :8002, GH :8989)

- **GraphHopper 10.0** (`routing/`): własny obraz z `eclipse-temurin:21-jre`,
  profil `wheelchair` (zawsze omija `highway=steps`, tylko tryb elastyczny —
  brak CH/LM, bo wysyłamy custom model per request). Import Małopolski przy
  pierwszym starcie trwał ~5 min (pobranie PBF ~150 MB było wolne). Dane w
  wolumenie `gh_data` — ponowny start jest szybki.
- Surowa trasa GH działa: Dworzec Główny → Rynek, 2 ścieżki, instrukcje po
  polsku (`locale=pl`), detale `surface/smoothness/road_class/street_name`.
- **`GET /api/route/?from=lat,lon&to=lat,lon&avoid=&<profil>`** — zgodnie
  z `docs/API.md` (sprawdzone curlem w obie strony):
  - `avoid=cobblestone` (lub `avoid_cobblestone=1`) zmienia trasę i podsumowanie:
    ON: `1,9 km, ok. 32 min · bez schodów · 3 odcinki trudnej nawierzchni · …`,
    OFF: `1,8 km … 4 odcinki trudnej nawierzchni`.
  - `steps` zawsze omijane po stronie GH; `duration_s` przeliczony na 3,6 km/h.
  - GH down → **503** `Usługa wyznaczania tras jest chwilowo niedostępna.`;
    brak ścieżki → **404** `Nie znaleźliśmy trasy bez barier między tymi punktami.`
- **Krawężniki/przejścia**: model `routing.Obstacle` + komenda
  `import_obstacles` (Overpass, bbox Kraków, ≤1 req/s, User-Agent, przy
  awarii stare dane zostają). Odcinki trasy dostają issues `crossing`/`kerb`
  (match / barrier / **unknown** `Brak danych o krawężniku…`) z `source` i
  `observed_at`. Fixturka `obstacles_demo.json` (4 punkty na trasie demo,
  `is_sample: true`) — załadować: `manage.py loaddata obstacles_demo`.
- **`GET /api/geocode/?q=`** — najpierw `places.Place`, potem Photon
  (bbox Kraków, bez `lang`, cache 1 h). Sprawdzone: Photon odpowiada.
- **Frontend `/trasa`**: Skąd/Dokąd (autouzupełnianie), Moja lokalizacja
  (geolokalizacja tylko na klik), Zamień, `ProfileChip`, `Unikaj <details>`,
  deep linki `?from=&to=` i `?toPlace=<id>` (używa `GET /api/places/:id/`),
  Opis/Mapa (`aria-pressed`, domyślnie Opis), numerowana lista odcinków
  (`MatchBadge` + źródło + data), karta alternatywy, mapa `LazyMap`
  (te same informacje w opisie), tryb `Rozpocznij` krok po kroku, stany
  ładowanie / 404 / 503 / offline. `vite build` przechodzi, `manage.py check`
  przechodzi, 9 testów (`manage.py test routing`, GH mockowany) przechodzi.

## Czego nie ma / ograniczenia

- **Brak elewacji (SRTM wyłączone)** — kroki mają `incline_pct: null`,
  a `avoid=steep` / `max_incline_pct` nie wpływają na wyznaczanie (checkbox
  istnieje, ale kroki nie pokazują nachylenia). Włączenie to 2 linijki
  w `routing/config.yml` + reimport; nie zdążyłem zweryfikować czasu.
- `avoid=high_kerbs` i `avoid=no_data` są akceptowane, ale nie zmieniają
  geometrii (GH nie zna krawężników) — widać je tylko w issues/podsumowaniu.
- Fixture krawężników ładuje się ręcznie (`loaddata`); `seed_demo` (A1) go
  nie wczytuje. Prawdziwe dane = `manage.py import_obstacles`.
- Nie kliknąłem strony w przeglądarce (brak GUI w tym środowisku) —
  przed mergem ktoś musi przejść `/trasa` klawiaturą na 375 px i ≥1024 px.
- Uwaga techniczna: GH zwraca detale małymi literami (`cobblestone`,
  `missing`); backend normalizuje do WIELKICH. W GH 10 **nie ma** wartości
  `SETT`/`UNHEWN_COBBLESTONE` (mapują się na `COBBLESTONE`).

## Dla innych agentów

- **A3**: link do trasy to `/trasa?toPlace=<id>` (działa też `?from=lat,lon&to=lat,lon`).
  Karta miejsca może linkować „Zaplanuj trasę” w ten sposób.
- **A1**: nie tykałem `places/` ani `settings.py`. GH czyta OSM sam;
  `routing.Obstacle` żyje niezależnie. `Source` dla routingu celowo nie
  tworzę (tabela `places_source` jest Twoja) — `data_source` w `/api/route/`
  to zahardkodowany `{osm, OpenStreetMap}`.
- Kontrakt `/api/route/` i `/api/geocode/` = dokładnie `docs/API.md` plus
  jedno dodane pole: `issues[].is_sample` (reguła „Dane przykładowe”).
- Inne stacki: usługa `graphhopper` startuje z każdym `docker compose up`;
  pierwszy import ~5 min, w tym czasie `/api/route/` zwraca 503 (to jest
  zamierzony przypadek demo „źródło niedostępne”).
