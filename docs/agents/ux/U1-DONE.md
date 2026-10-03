# U1 — DONE (wspólne komponenty i style)

Gałąź `ux/u1-wspolne`. Wszystkie zadania U1-1 … U1-8 zrobione, każde z `vite build` + commitem.

## Zadania

- U1-1 zrobione: style `details > summary` (strzałka `::after`, `min-height: var(--tap)`) dopisane na końcu `base.css`, dokładnie jak w briefie.
- U1-2 zrobione: `PrototypeBanner.jsx` — `<div>` → `<aside aria-label="Informacja o prototypie">`; `.prototype-banner .btn` → `min-height: var(--tap)`.
- U1-3 zrobione: `.site-footer li a` → `min-height: var(--tap)`.
- U1-3b (dobudówka do U1-3, ta sama reguła): `.site-footer li a` i `.desktop-nav a:not(.btn)` dostały też `min-width: var(--tap)`. Bez tego audyt zgłaszał `small target 30x48 px: <a> "FAQ"` (krótki link ma <44 px szerokości), a twarda zasada 6 wymaga 48×48 dla linków niebędących tekstem ciągłym. Zmiana w moich plikach, minimalna, addytywna.
- U1-4 zrobione: `MatchBadge` przyjmuje `muted` (klasa `badge badge--muted` + ikona `info`); `MatchSummary` przekazuje `muted` dla „pasuje” i „barier” gdy wartość = 0; reguła `.badge--muted` w `base.css`. Teksty bez zmian.
- U1-5 zrobione: `scroll-padding` w `base.css`, dokładnie jak w briefie.
- U1-6 zrobione: klasa `.card-link` w `base.css`, dokładnie jak w briefie.
- U1-7 zrobione: `ErrorState` przyjmuje opcjonalny `onRetry` (przycisk „Spróbuj ponownie”); `Empty` renderuje tytuł jako `<h2>`. `Empty` jest użyte w `Search.jsx` i `PlaceHistory.jsx` (pliki U2) zawsze pod `<h1>`, więc `h1 → h2` nie robi przeskoku — audyt nie zgłasza pominiętych nagłówków.
- U1-8 zrobione: w `Header.jsx` efekt od `Escape` obsługuje też `Tab` (zapętlenie fokusu w `#site-menu`: selektor `a[href], button`), otwarte menu ustawia `document.body.style.overflow = 'hidden'` i czyści przy zamknięciu.
- Pominięte: brak.

## Audyt (`tools/a11y`, wszystkie trasy, bez argumentów)

Środowisko: Docker niedostępny (brak uprawnień do socketa, Docker Desktop nie daje się uruchomić),
więc backendu nie było. Frontend: `npx vite --port 5181` na hoście, `BASE_URL=http://127.0.0.1:5181`
(to samo co `localhost:5181`). Bez backendu strony zależne od API pokazują stany błędu/pusto —
kontrole strukturalne (landmarki, nagłówki, cele, skip-link) są mimo to miarodajne.

- Przebieg 1 (po U1-1 … U1-8): 86 problemów, 0/60 „ok” — w tym 76× `small target … "FAQ"` (szerokość linków).
- Przebieg 2 (po U1-3b): **10 problemów, 56/60 „ok”**.

Zostały wyłącznie błędy z plików innych agentów:

```
FAIL [phone 390] /widget/5
     - axe region: All page content should be contained by landmarks -> #root
     - axe page-has-heading-one / page has 0 <h1>
     - axe landmark-one-main
FAIL [zoom 320] /widget/5
     - page has 0 <h1> (expected 1)
FAIL [desktop] /widget/5   (jak phone)
FAIL [desktop] /moje-potrzeby
     - axe target-size (serious): .needs-stepper > button … (przyciski +/− krokowe)
```

- `/widget/5` (9 problemów: brak `<h1>`, brak `<main>`, region) — robi U2 (zapowiedziane w briefie).
- `/moje-potrzeby` (1 problem: przyciski steppera) — strona U4 (`Needs.jsx`), plik spoza mojej listy.

## Test klawiaturą (skryptowana sonda, headless Chrome, 390 px i 1280 px) — 13/13 PASS

1. Pierwszy Tab → link „Przejdź do treści” (390 i 1280); Enter przenosi fokus do `<main>`.
2. Menu (390): Enter otwiera; 30× Tab — fokus krąży tylko po `#site-menu`; body ma `overflow: hidden`; Esc zamyka i wraca na przycisk „Menu”.
3. `<details>` na `/faq`: `summary` ma 48 px i strzałkę `::after`; Enter otwiera.
4. Style: baner to `<aside aria-label="Informacja o prototypie">`; reguła `.badge--muted` (dashed) istnieje; `scroll-padding-bottom` = 160 px.
5. Ręcznego klikania całej strony nie było (brak interaktywnej przeglądarki w tym środowisku); Tab-walk przez całą stronę zastąpiono sondą + audytem (audyt sprawdza pierwszy Tab i cele na każdej trasie).

## Znane problemy / uwagi

- Brak testu jednostkowego we frontendzie: repo nie ma harnessu testowego, a runda zabrania instalowania bibliotek i ruszania `package.json`, więc nie dodano frameworka. Weryfikacja: `vite build` po każdym zadaniu + audyt + sonda `/tmp/u1-kbd.mjs` (scratch, niecommitowana).
- U1-4 (wyciszone „0 barier”): bez backendu `MatchSummary` z danymi się nie renderuje; zweryfikowano budowanie, regułę CSS i logikę `muted={… === 0}` przeglądem kodu. U2/U4 do potwierdzenia wizualnie z danymi.
- `git push` na `ux/u1-wspolne` wykonany.
