# A1 — Data & API: DONE

## Co działa

- `POST /api/reports/` — zgłoszenia bez konta, honeypot `website` (201 bez zapisu),
  throttle 20/h, walidacja typów wg katalogu, daty nie z przyszłości, polskie błędy.
  Tworzy `Fact` (`user` / `user_report`, `is_sample=False`) widoczny od razu na karcie.
- `GET /api/places/:id/history/` — pełna historia faktów, od najnowszych,
  `old_value_display` = poprzednia wartość tego parametru.
- `GET /api/places/` — nowe parametry: `near=lat,lon` (+ `distance_m`),
  `ordering=match|distance|documented` (domyślnie najmniej barier, potem najwięcej pasujących),
  `bbox=minLon,minLat,maxLon,maxLat`. `q` szuka też po etykietach kategorii
  („muzeum” → Muzea) i jest bezogonkowe (migracja `unaccent`).
- `python manage.py import_osm [--bbox s,w,n,e] [--offline] [--endpoint URL] [--dump-fixture]`
  — mapowanie tagów w jednym słowniku (`map_tags`), kategorie, adresy, upsert po
  `(osm_type, osm_id)`, nowy fakt tylko przy zmianie wartości, cache odpowiedzi
  (+ pliki per-zapytanie, wznawianie), błąd → `Source(osm)=unavailable` bez usuwania danych.
- `seed_demo` — jak było (konflikt, outdated, brak danych, user report,
  `krakow_open_data=unavailable`) + ładuje `places/fixtures/osm_krakow.json`
  (upsert, idempotentne) + potwierdzenie `owner` (przykładowe, `is_sample=True`)
  na jednym prawdziwym miejscu OSM.
- Stretch: `import_krakow_open_data` (szkielet; brak usable datasetu z atrybutami
  dostępności — docstring wskazuje kandydata), akcje admina accept/reject na
  zgłoszeniach, 2+ zgodne zgłoszenia dopisują „Potwierdzają to N zgłoszenia…” do notki.
- Testy: `python manage.py test places` — 13 testów (raporty, historia, matching:
  konflikt/outdated/missing/irrelevant-missing/podwójne zgłoszenie, wyszukiwanie:
  kategoria/bezogonki/near/bbox).

## Czego brakuje / ryzyka

- **Fikstura OSM**: import z Overpass jest w toku — publiczny endpoint jest mocno
  limitowany (429/504) i DNS z kontenerów bywa niestabilny. Jeśli import się powiedzie,
  fikstura trafi do `backend/places/fixtures/osm_krakow.json` i `seed_demo` ją załaduje.
  Bez niej demo działa tylko na 4 przykładowych miejscach.
- `seed_demo` ładuje fiksturę po kluczach `(osm_type, osm_id)`; źródła faktów mapuje
  po kluczu (`places.source` z fikstury) — odporne na inne PK.

## Dla innych agentów

- A4: `POST /api/reports/` zwraca `201 {"id","status":"pending","fact_id"}`; błędy `400`
  w formacie DRF z polskimi komunikatami. Honeypot: `website` wypełnione → `201 {"status":"pending"}`.
- A3: historia pod `GET /api/places/:id/history/`; lista przyjmuje `near/ordering/bbox`;
  `distance_m` pojawia się tylko z `near`.
- Throttle raportów: 20/h z IP (AnonRateThrottle `reports`).
- Nie ruszałem niczego poza `backend/places/**` i dodatkami w `settings.py`
  (`django.contrib.postgres`, throttle rates).


## Dokończenie (przejęte przez lead, 03.10)

- **Publiczne serwery Overpass były nieosiągalne** (timeouty na overpass-api.de, kumi, mail.ru),
  stąd zawieszony import. `import_osm` domyślnie korzysta teraz z **ekstraktu Geofabrik**
  (`--via pbf`, region `europe/poland/malopolskie`, aktualizowany codziennie): pobiera plik raz,
  wycina bbox i filtruje POI lokalnie przez `osmium` (dodane do obrazu backendu). Import trwa ~10 s.
  Overpass dalej dostępny: `--via overpass` (2 serwery, krótsze ponawianie).
  Kolejne miasto: `--bbox s,w,n,e --region europe/poland/<województwo>`.
- Wynik: **1951 prawdziwych miejsc** (w tym 65 toalet publicznych), **~470 faktów** z OSM,
  daty edycji 2014–2026 (stare dane same pokazują się jako „Może być nieaktualne”).
  Fikstura `places/fixtures/osm_krakow.json` (800 KB) — demo działa bez sieci.
- Poprawki mapowania: szerokości w metrach → cm (`door:width=0.9` → 90 cm);
  toalety bez nazwy → „Toaleta publiczna”.
- `seed_demo`: miejsca przykładowe mają **stałe ID** (upsert po nazwie, resetowane są tylko
  fakty przykładowe — prawdziwe zgłoszenia zostają); potwierdzenie właściciela dodawane raz,
  nie przy każdym restarcie.
- Brak miejsca → 404 (karta i historia), wcześniej 500.
- Sortowanie „najlepsze dopasowanie”: miejsca z małą ilością danych nigdy nie wyprzedzają
  udokumentowanych; „najlepiej udokumentowane” liczy też dane z OSM; `near` sortuje w bazie
  przed limitem wyników.
- 18 testów (`manage.py test places`), w tym regresje powyższych.
