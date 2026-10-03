# U3 — DONE (`/trasa`)

Gałąź `ux/u3-trasa`. Wszystkie 8 zadań z briefu zrobione, każde z osobnym commitem
(`U3-1` … `U3-8`). Po każdym zadaniu: `npx vite build` OK, `rm -rf dist`.
Nie zmieniano `Dockerfile`, więc bez przebudowy stosu (stos `bp-u3` działał cały czas).

## Zadania

- U3-1 (zrobione): w `pages/RoutePlanner.css` z reguły `.route-avoid summary`
  usunięte `display`, `align-items`, `min-height` (nie było `list-style`
  ani `::-webkit-details-marker`). Reszta bez zmian.
- U3-2 (zrobione): `AVOID_OPTIONS` dokładnie wg briefu (hinty: kostka zmienia
  trasę, reszta tylko oznaczana / brak danych). Hint w
  `<span className="route-avoid__hint">` wewnątrz `<label>` + `aria-describedby`
  na `<input>`. CSS `.route-avoid__hint` dokładnie wg briefu.
- U3-3 (zrobione): na początku wyniku
  `<h2 className="route-result__title" tabIndex={-1} ref={titleRef}>Wynik: trasa
  bez schodów</h2>`, fokus raz przy pierwszym pokazaniu (`useEffect … []`),
  `aria-live` usunięte z `<p className="route-summary">`. Kolejność nagłówków
  h1 „Zaplanuj trasę” → h2 „Wynik…” (audyt nie zgłasza przeskoku).
- U3-4 (zrobione): `parsePoint` zwraca
  `` `Punkt na mapie (${lat.toFixed(4)}, ${lon.toFixed(4)})` ``.
- U3-5 (zrobione): `.route-step--match` bez ramki/tła, tylko dolna linia,
  `padding: var(--space-2) 0`. `--barrier` i `--unknown` bez zmian (karty).
  Ikon i tekstów nie ruszano.
- U3-6 (zrobione): w bloku `state === 'e503'` przycisk „Spróbuj ponownie”
  (`submitAgain` → `fetchRoute(from, to, avoid)`) + zdanie „Przy pierwszym
  uruchomieniu serwis tras przygotowuje mapę (kilka minut).”
- U3-7 (zrobione): `isDesktop = window.matchMedia('(min-width: 1024px)').matches`;
  na desktopie brak przełącznika „Opis / Mapa”, lista kroków i mapa renderowane
  jednocześnie w `.route-result__body` (grid z briefu, mapa sticky 70vh),
  pod mapą „Te same informacje są w opisie trasy obok.”. Sprawdzone: 1280 px —
  `body` grid, mapa widoczna, przełącznik ukryty; 390 px — przełącznik widoczny,
  jak dotąd.
- U3-8 (zrobione): w trybie `guided` nagłówek kroku to `h3` z `tabIndex={-1}`,
  fokus przy wejściu i po „Następny / Poprzedni” (`useEffect … [idx]`);
  „Następny” `disabled` na ostatnim kroku (było już w kodzie); przycisk wyjścia
  przemianowany na „Zakończ prowadzenie”, powrót do listy z fokusem na `h2`
  wyniku (`exitGuided` + `setTimeout focus`).

## Audyt (`tools/a11y`, BASE_URL=http://localhost:5183)

Trasy: `/trasa`, `/trasa?from=50.0684238,19.9478862&toPlace=5`.
Wynik: FAIL — 41 problemów, **wszystkie poza moimi plikami albo wynikające
wprost z briefu** (szczegóły niżej). Na moich stronach: jeden `<h1>`, brak
przeskoków nagłówków (h1 → h2 → h3), brak poziomego scrolla przy 320 px,
żaden mój przycisk/pole nie jest za mały (pełna lista 13 celów sprawdzona
osobną sondą — wszystkie to banner/nawigacja/stopka).

- `axe region … .prototype-banner__inner > p` — layout U1, nie moje pliki.
- Małe cele: przycisk „Zwiń informację o prototypie” oraz linki nawigacji
  i stopki („Sprawdź miejsce”, „Zaplanuj trasę”, „Jak to działa”, „FAQ”, …)
  — layout U1, nie moje pliki.
- Mały cel `<summary> „Unikaj (schody omijamy zawsze)”` — mój plik, ale brief
  U3-1 mówi wprost: „Strzałkę i 48 px dodaje globalnie agent U1.” Czeka na
  globalny styl U1; nie ruszam (pliki U1 poza moją listą).
- `first Tab focuses „Rozpocznij prowadzenie krok po kroku” instead of the
  skip link` (tylko desktop + deep link z wynikiem) — konsekwencja wymaganego
  w U3-3 przeniesienia fokusu na `h2` wyniku po wyznaczeniu trasy. Zachowanie
  zgodne z briefem; sam skip link działa (test klawiatury pkt 1–2).

## Test klawiaturą 390 px (scenariusz z briefu, sonda puppeteer)

1. Pierwszy Tab → link „Przejdź do treści”; Enter → fokus w treści. OK.
2. „Kraków Główny” w „Skąd” → Tab do wyniku → Enter → wybrane (pole: „Kraków
   Główny”). OK. (Po wyborze fokus spada na `body` — tak działa komponent
   `PlaceSearch`; brief nie kazał tego zmieniać, wyboru dokonano poprawnie.)
3. „Sukiennice” w „Dokąd” → Enter → wybrane. OK.
4. „Wyznacz trasę” → Enter → fokus na `h2` „Wynik: trasa bez schodów”,
   25 kroków. OK.
5. „Rozpocznij prowadzenie krok po kroku” → fokus na `h3` kroku;
   „Następny” ×3 → licznik 1→4 z 25, fokus za każdym razem na nowym `h3`. OK.
6. „Zakończ prowadzenie” → fokus z powrotem na `h2` wyniku. OK.

GraphHopper gotowy (brak stanu 503 w teście); stan `e503` z U3-6
(przycisk + zdanie) zweryfikowany tylko z kodu — usługa odpowiadała.

## Znane problemy

- Brak — poza pozycjami z sekcji Audyt (pliki U1 / decyzje z briefu).
