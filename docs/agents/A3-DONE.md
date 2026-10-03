# A3 — DONE: Search & place card

## Co działa
- `/szukaj`: przyklejone pole „Dokąd?” (`<form role="search">`), `ProfileChip`,
  filtry kategorii z `useMeta` (`aria-pressed`, scroll w poziomie), URL `?q=&category=`,
  debounce 350 ms, `aria-live` „Znaleziono N miejsc”, przełącznik Lista/Mapa,
  sortowanie (dopasowanie / najbliższe / udokumentowane) z fallback-sortowaniem
  po stronie klienta (backend `ordering`/`near` ląduje z A1).
- Wyniki: cała karta jednym linkiem do `/miejsce/:id`, `MatchSummary`, linia
  `top_fact`, `SampleBadge`, pasek „Mało danych: oceń ostrożnie”, odległość
  (gdy backend poda `distance_m`). Stany: `Loading`, `Empty` („Nie znaleźliśmy
  tego miejsca” + wskazówki), `ErrorState`, baner offline. Przed wpisaniem:
  „Ostatnio oglądane” z localStorage.
- Mapa: `LazyMap` ładowany tylko w widoku mapy, pinezki kształtem po matchu
  (bariera → `summary.barrier>0`, nieznane → `low_data`, inaczej pasuje),
  klik → bottom sheet + „Szczegóły”, notka „Te same wyniki są w widoku listy”,
  desktop ≥1024 px: lista 40% + mapa, hover/focus karty podświetla pinezkę.
- `/miejsce/:id`: kolejność wg briefu (←Wyniki, H1, Nawiguj/OSM + Trasa tutaj,
  baner „Dane przykładowe”, `MatchSummary` + „Dla Twojego profilu »…«” + Zmień,
  `key_note`, akordeony `<details>` otwarte przy barierze, parametry jako
  `<table>` (na mobile schodkowane przez CSS), „Inne źródła (n)”, konflikty
  z wszystkimi wersjami + „Byłem tam, potwierdzam” (POST przez `createReport`;
  przy 404 fallback-link do `/zglos`), „Brak danych” + „Pomóż uzupełnić”,
  „Zadzwoń przed wizytą” przy starych danych, mapa w `<details>` + tekstowa
  alternatywa, kontakt `tel:`, stopka (ostatnia zmiana, historia, `/dla-firm`,
  źródła z licencjami, OSM), sticky „Zgłoś zmianę lub błąd”.
- Karta zapisuje się w localStorage; offline pokazywana jest zapisana kopia
  z napisem „Wersja zapisana DD.MM.RRRR, możesz być offline”.
- `/miejsce/:id/historia`: tabela (karty na mobile), 404 traktowany jako
  „niedostępne — backend w przygotowaniu” (A1), nie jako błąd.
- `/widget/:id` bez chrome: nazwa, `MatchSummary`, przełącznik Wózek / Wózek
  dziecięcy (`aria-pressed`), top 4 parametry ze źródłami, link „Pełna karta
  w BezProgu” (`target="_blank"`). `frontend/public/widget-demo.html` — fałszywa
  strona hotelu z `<iframe>` do filmu z pitchu.
- `vite build` przechodzi. Brak `localhost:8000` w kodzie. Zero razy słowo
  „dostępne” jako werdykt.

## Czego nie ma / ograniczenia
- Docker niedostępny w tym środowisku (brak dostępu do docker.sock), więc brak
  klik-testów w przeglądarce i brak testów przeciw żywemu backendowi. Kod pisany
  ściśle wg `docs/API.md` + `backend/places/views.py`/`matching.py` (przeczytane).
- `npm install` wykonany lokalnie dla build-checka (node_modules nie było);
  `dist/` usunięty. Jeśli `package-lock.json` się zmienił — sprawdzić przed mergem.
- Sortowanie „Najbliższe”: przycisk „Użyj mojej lokalizacji” wysyła `near=`
  (backend zignoruje, aż A1 doda wsparcie); `distance_m` pokaże się samo.

## Dla innych agentów
- A1: czekam na `GET /api/places/:id/history/`, `near` + `ordering=match|distance|
  documented` w liście. Wszystko obsługiwane łagodnie (fallback klienta).
- A4: używam Twojego `createReport` z `api/reports.js` (import, bez zmian).
  Linki do `/zglos?place=:id&parameter=:key` i `/trasa?toPlace=:id` — muszą je
  czytać Wasze strony.
- A2: `/trasa?toPlace=:id` linkowany z karty miejsca.
- Wspólne: nie ruszałem plików współdzielonych ani `App.jsx`. Nowe pliki tylko
  w moim katalogu: `components/place/{ResultCard,ParameterRow,recent}`,
  CSS-y stron, `frontend/public/widget-demo.html`.
