# A4 — Needs profile, reporting, home & content pages (frontend)

Branch `agent/a4-content`. You own all pages except Search/Place/PlaceHistory/Widget/RoutePlanner,
plus `frontend/src/components/{content,needs,report}/**`, `frontend/src/api/reports.js`, `docs/pitch/**`.
Read `AGENTS.md`, `docs/API.md` and the spec `docs/SPEC.md` (sections 1, 5–12).

Content pages are worth a lot: business model (20%) and scalability (20%) are judged largely
from `/dla-firm`, `/dla-miast` and `/dane`. Write real, specific, concise Polish content — not lorem ipsum.

## 1. `/moje-potrzeby` (needed by everyone — do first)
- Intro: "Powiedz nam, co jest dla Ciebie barierą. Nie pytamy o niepełnosprawność. Ustawienia
  zostają tylko na tym urządzeniu."
- 3 big radio cards: Wózek inwalidzki / Wózek dziecięcy / Własne ustawienia → fill values from
  `useMeta().profile_presets`.
- Detailed settings grouped (Wejście, Nawierzchnia, Wnętrze, Odpoczynek) from `profile_fields`:
  numbers = `<input type="number">` with −/+ buttons (no sliders), bools = checkboxes/switches
  (`role="switch"` optional). Each with `<details>` "Co to znaczy?" (e.g. "6% nachylenia to 6 cm
  w górę na każdy metr").
- Sticky "Zapisz ustawienia" → `setProfile(...)` from `useProfile`, confirmation in `aria-live`.
  Editing values after choosing a preset switches preset to `custom`.
- Section "Synchronizacja między urządzeniami (opcjonalnie)" — text only + link to /prywatnosc.

## 2. `/zglos` — 3-step report
- Pre-fill from `?place=:id&parameter=key`. Without `place`: search field (`searchPlaces` from
  `api/places.js`) to pick a place.
- Text progress "Krok 1 z 3". Step 1: parameter as big radio buttons (from `useMeta().parameters`,
  grouped). Step 2: current value (read-only, from `getPlace`) + new value input matching parameter
  type (number / tak-nie / enum select), optional comment, observation date (default today).
  Photo upload: show the UI note "lokalizacja z metadanych zostanie usunięta" but you may skip actual
  upload for the MVP (say "wkrótce" — don't fake it). Step 3: summary, optional e-mail, "Wyślij".
- Hidden honeypot input `website` (visually hidden, `tabIndex=-1`, `autocomplete="off"`, `aria-hidden`).
- Errors next to fields + error summary at top of the step that receives focus. Map DRF 400 responses.
- Success screen: "Zgłoszenie jest już widoczne na karcie jako »Zgłoszenie użytkownika«…",
  button "Wróć do miejsca". Until A1's endpoint exists, `createReport` will 404 — show ErrorState.

## 3. Home `/`
Spec section 1, in order: hero H1 "Nie »dostępne«. Konkretnie." + subtitle; profile toggle
(Wózek / Wózek dziecięcy, `aria-pressed`, sets the profile preset); "Dokąd?" field → navigate to
`/szukaj?q=`; "Albo zaplanuj trasę →"; quick example pills (Sukiennice → `/szukaj?q=Sukiennice`,
Dworzec → Rynek → `/trasa?...`, Kino Pod Baranami) each with "przykład" label; problem section
("Tak jest dziś" vs "Tak jest w BezProgu"); 3 steps; reliability legend using `StatusIcon`;
partner fork (Dla firm / Dla miast). Desktop: 2-column hero.

## 4. Content pages (concise, specific, mobile-first)
- `/dane` (judged: data reliability, 15%): statuses (6 cards with `StatusIcon` + text — get them from
  `useMeta().reliability`), sources as `<details>` — load live from `/api/sources/` and show
  status/last sync/licence/refresh policy (shows the "source unavailable" case live!),
  source merging rules (copy the rules from `backend/places/matching.py` docstring in plain Polish),
  "Gdy coś zawodzi" (conflict / missing / source down — what the user sees), correction flow
  (report → visible as unverified → confirmed by others/owner → optional contribution back to OSM).
- `/dla-firm` (business model, 20%): segments (hotels, event organisers, property managers,
  booking platforms & map apps), widget preview (link `/widget-demo.html` from A3 if it exists),
  3 steps to start, pricing as proposal (Free for users; Obiekt Podstawowy 0 zł — confirm data;
  Obiekt Pro ~49 zł/mies. — widget, photos, statistics; Platformy/API & miasta — indywidualnie /
  licence per city), explicit guarantee: payment never raises reliability or ranking. Contact form
  (front-end only, `mailto:` fallback is fine — don't pretend it sends).
- `/dla-miast` (scalability, 20%): "Kolejne miasto to konfiguracja, nie nowy projekt"; architecture
  as a vertical list Źródła → Pozyskiwanie (importers per source) → Normalizacja (Fact model) →
  Ocena wiarygodności (matching) → API → Prezentacja (web, widget, partner API) with text for each;
  how to add a city (run importer with a new area), a source (new importer + Source row), a category;
  dependencies & licences (OSM ODbL, Leaflet BSD-2, GraphHopper Apache 2.0, Django BSD, PostGIS GPL,
  all self-hostable → portable infrastructure); maintenance model (operator: startup/NGO; hosting
  ~200–400 zł/mies.; security; report handling); roadmap timeline Hackathon → Pilot → Usługa → Skalowanie.
- `/jak-to-dziala`, `/faq` (native `<details>`), `/dostepnosc` (WCAG 2.2 AA target, what works,
  known limitations: map keyboard support, no VoiceOver/TalkBack tests yet, no easy-to-read version),
  `/prywatnosc` (5-sentence plain summary first: profile only on device, no disability data,
  reports store no IP — only a hash, optional e-mail, HTTPS), `/regulamin`, `/licencje`.

## 5. Pitch material — `docs/pitch/`
`slides.md`: outline for ≤10 slides (problem, target group, solution + demo screenshots, data &
reliability, architecture & scaling, business model, roadmap, team). `demo-script.md`: 3-min video
script following the jury demo path from the spec. `README` sections for the formal requirements
(problem, target group, data sources + reliability, business model) — write them as `docs/pitch/submission.md`.

## Done when
Every page has one H1, title, works at 375 px with keyboard only, and contains real content.
