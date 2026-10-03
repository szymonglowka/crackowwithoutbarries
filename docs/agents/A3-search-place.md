# A3 — Search & place card (frontend)

Branch `agent/a3-search`. You own `frontend/src/pages/{Search,Place,PlaceHistory,Widget}.*`,
`frontend/src/components/place/**`, `frontend/src/components/map/**`, `frontend/src/api/places.js`.
Read `AGENTS.md`, `docs/API.md` and the spec sections "2. Wyszukiwarka" and "3. Karta miejsca" in
`docs/SPEC.md`. These are the most important screens in the jury demo — polish matters.

Backend `/api/places/` (list + detail) already works with sample data, so you can start immediately.
`/history/` and `near/ordering` come from A1 — handle 404 gracefully until then.

## 1. `/szukaj` — search & results
- Sticky search field (`<form role="search">`, label "Dokąd?"), `ProfileChip` under it,
  category filter buttons from `useMeta().categories` (`aria-pressed`, horizontally scrollable row).
- Read/write `?q=&category=` in the URL (home page search submits to `/szukaj?q=...`).
- Debounced fetch `searchPlaces({ q, category, profile: profile.values, ordering })`.
- `aria-live="polite"` region: "Znaleziono 12 miejsc".
- Toggle "Lista / Mapa" (two buttons, `aria-pressed`, default Lista). Map via `LazyMap` (only
  loaded when shown) with pin shape by match (`barrier` if summary.barrier>0, `unknown` if low_data,
  else `match`). Clicking a pin opens a bottom sheet with the same result card + "Szczegóły".
  Note above map: "Te same wyniki są w widoku listy". Desktop ≥1024px: list (40%) + map side by side,
  hover/focus on card highlights the pin (`highlightId`).
- Result card = ONE link to `/miejsce/:id`: name, category, distance (if any), `MatchSummary`,
  `top_fact` line ("Wejście boczne bez progu, potwierdzone 09.2026"), `SampleBadge` if `is_sample`,
  grey bar "Mało danych: oceń ostrożnie" if `low_data`.
- Sort `<select>`: Najlepsze dopasowanie / Najbliższe / Najlepiej udokumentowane (`ordering` param).
  "Najbliższe" asks for geolocation only when chosen ("Użyj mojej lokalizacji").
- Before typing: "Ostatnio oglądane" from localStorage (store on place card view: id, name, date,
  and the full JSON for offline use).
- States: `Loading`, `Empty` ("Nie znaleźliśmy tego miejsca" + tips), `ErrorState`, offline banner.

## 2. `/miejsce/:id` — place card (the key screen)
Follow spec order exactly:
1. "← Wyniki" (history back), H1 name, category, address + "Nawiguj" link
   (`https://www.openstreetmap.org/directions?to=lat,lon` or `geo:` URI), link "Trasa tutaj"
   → `/trasa?toPlace=:id`.
2. `is_sample` → non-dismissable amber notice "Dane przykładowe — ten obiekt służy do demonstracji".
3. `MatchSummary` + "Dla Twojego profilu »…«" + "Zmień profil". Never the word "dostępne".
4. `key_note` as a highlighted block (if any).
5. Groups as `<details>` accordions; groups with a barrier are `open` by default; summary line
   shows counts e.g. "Toaleta: 1 brak danych".
6. Each parameter row (mobile, 4 lines): **label: value** · `MatchBadge` + `requirement` ·
   source name + "potwierdzone DD.MM.RRRR" · `ReliabilityBadge`. More sources → `<details>` "Inne źródła (n)".
   `status: conflicting` → amber/red border, ALL source values visible at once, button
   "Byłem tam, potwierdzam" → `POST /api/reports/` with that value (via A4's `createReport`; if
   endpoint missing yet, link to `/zglos?place=:id&parameter=key`).
   `status: missing` → "Brak danych" + link "Pomóż uzupełnić" → `/zglos?place=:id&parameter=key`.
   `outdated` → show badge and "Zadzwoń przed wizytą" near contact.
   Desktop: parameters in a real `<table>` with `<th scope>`.
7. "Pokaż na mapie" `<details>` containing `LazyMap` + "Wszystkie informacje z mapy są opisane powyżej".
8. Contact: `tel:` link, website.
9. Footer: "Ostatnia zmiana: …", link "Historia zmian", "Jesteś właścicielem? Potwierdź dane" → `/dla-firm`,
   source list with licences (from `sources`), "Zobacz w OpenStreetMap" if `osm_url`.
10. Sticky button above bottom nav: "Zgłoś zmianę lub błąd" → `/zglos?place=:id`.
- Save the response to localStorage ("recently viewed"); when offline, show the saved copy with
  "Wersja zapisana DD.MM.RRRR, możesz być offline".

## 3. `/miejsce/:id/historia`
Cards (mobile) / table (desktop) from `/api/places/:id/history/`: date, parameter, old → new value,
source, reliability badge, sample badge.

## 4. Stretch: `/widget/:id` (business model demo!)
Compact, embeddable card (no site chrome): name, `MatchSummary` for a default wheelchair profile
plus a toggle for stroller, top 4 parameters with sources, "Pełna karta w BezProgu" link
(`target="_blank"`). Add `frontend/public/widget-demo.html` — a fake hotel page that embeds it
in an `<iframe>`, for the pitch video.

## Demo path to verify
`/szukaj?q=sukiennice` → card shows: barrier (3 steps), alternative entrance key note, conflict on
threshold (2 vs 5 cm), outdated toilet info, missing changing table → "Zgłoś" works.
All with keyboard only, and at 375 px wide.
