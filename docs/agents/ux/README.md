# Runda UX/UI + dostępność — zasady wspólne dla agentów U1–U4

Przeczytaj CAŁY ten plik, potem `AGENTS.md`, potem swój brief (`U1-…`, `U2-…`, `U3-…`, `U4-…`).
Wykonuj zadania **po kolei, dokładnie tak, jak są opisane**. Nie dodawaj własnych „ulepszeń”, których
nie ma w briefie. Jeśli coś jest niejasne albo zadanie wymaga zmiany pliku spoza Twojej listy —
**nie zgaduj**: pomiń to zadanie i opisz problem w swoim pliku DONE.

## Cel rundy

Aplikacja działa. Teraz ma być **czytelniejsza, spójniejsza i w pełni obsługiwalna klawiaturą
i czytnikiem ekranu** (cel: WCAG 2.2 AA). Nie dodajemy nowych funkcji. Nie zmieniamy backendu ani API.

## Kto co edytuje (pliki rozłączne — trzymaj się listy)

| Agent | Gałąź | Pliki, które WOLNO Ci zmieniać |
|---|---|---|
| U1 wspólne | `ux/u1-wspolne` | `frontend/src/styles/**`, `frontend/src/components/layout/**`, `frontend/src/components/Badges.jsx`, `frontend/src/components/StatusIcon.jsx`, `frontend/src/components/PageStates.jsx`, `frontend/src/components/ProfileChip.jsx` |
| U2 szukaj + karta | `ux/u2-szukaj-karta` | `frontend/src/pages/{Search,Place,PlaceHistory,Widget}.{jsx,css}`, `frontend/src/components/place/**`, `frontend/src/components/map/**` |
| U3 trasa | `ux/u3-trasa` | `frontend/src/pages/RoutePlanner.{jsx,css}`, `frontend/src/components/route/**` |
| U4 strony | `ux/u4-strony` | `frontend/src/pages/{Home,Needs,Report,HowItWorks,Data,ForBusiness,ForCities,Faq,AccessibilityStatement,Privacy,Terms,Licenses,NotFound}.{jsx,css}` |

Nikt nie zmienia: `backend/**`, `frontend/src/App.jsx`, `frontend/src/api/**`, `frontend/src/hooks/**`,
`docker-compose.yml`, `package.json`. **Nie instaluj żadnych nowych bibliotek.**

## Twarde zasady (każde naruszenie = zadanie niezaliczone)

1. **Nigdy** `outline: none` / `outline: 0` bez widocznego zamiennika. Globalny styl fokusu jest w `base.css` — nie nadpisuj go.
2. **Nigdy** `tabIndex` większy niż 0. `tabIndex={-1}` tylko na nagłówkach/kontenerach, na które przenosisz fokus z kodu.
3. **Nigdy** `<div onClick>` ani `<span onClick>`. Akcja = `<button type="button">`, przejście = `<a>` / `<Link>`.
4. **Nigdy** placeholder zamiast etykiety. Każde pole ma `<label>` nad polem.
5. **Nigdy** stan przekazany tylko kolorem. Zawsze ikona o innym kształcie + słowo (gotowe: `MatchBadge`, `ReliabilityBadge`, `StatusIcon`).
6. Każdy cel dotykowy (przycisk, link-przycisk, `summary`, etykieta checkboxa) ma **min. 48×48 px** (`var(--tap)`). Wyjątek: linki w tekście ciągłym.
7. Kolory tylko z `frontend/src/styles/tokens.css`. Nie wpisuj nowych kolorów hex w CSS stron.
8. Mobile first: najpierw style dla 360 px, potem `@media (min-width: 600px)` i `@media (min-width: 1024px)`.
9. Żadnych animacji potrzebnych do zrozumienia treści. Jeśli dodajesz `transition`, to tylko krótkie (≤150 ms) i wyłączone przez istniejący blok `prefers-reduced-motion` w `base.css`.
10. Teksty UI po polsku. Nigdy słowo „dostępne” jako werdykt.
11. Nie usuwaj niczego, co oznacza dane przykładowe, źródło, datę albo status wiarygodności — to jest oceniane przez jury.

## Jak uruchomić i sprawdzić swoją pracę

Każdy agent ma własny worktree i własny stos Dockera (porty w `.env`, tabela w `AGENTS.md`).

```bash
docker compose up -d --build db backend frontend   # U1, U2, U4: bez serwisu tras (oszczędza ~2 GB RAM)
docker compose up -d --build                       # tylko U3: z serwisem tras (GraphHopper)
cd frontend && npx vite build && rm -rf dist && cd ..
cd tools/a11y && npm install          # tylko raz
BASE_URL=http://localhost:<TWÓJ_PORT_FRONTENDU> npm run audit -- <Twoje trasy>
```

Przykład dla U2 (frontend na porcie 5176): `BASE_URL=http://localhost:5176 npm run audit -- /szukaj /szukaj?q=muzeum /miejsce/5 /miejsce/5/historia /widget/5`

Audyt sprawdza: reguły WCAG 2.2 AA (axe-core), jeden `<h1>`, kolejność nagłówków, tytuł strony,
brak poziomego przewijania przy 320 px (powiększenie 200%), cele ≥44 px, pierwszy Tab na „Przejdź do treści”.
**Twoje trasy muszą przejść audyt bez błędów** (poza błędami, które w Twoim briefie są oznaczone jako
naprawiane przez innego agenta — wtedy wypisz je w DONE).

## Ręczny test klawiaturą (obowiązkowy dla każdej zmienionej strony)

1. Odśwież stronę, naciśnij Tab: pierwszy jest link „Przejdź do treści”, Enter przenosi do treści.
2. Przejdź Tabem przez całą stronę: fokus jest **zawsze widoczny**, kolejność zgodna z kolejnością na ekranie, nic nie jest zasłonięte przez przyklejone paski.
3. Każdą akcję wykonasz Enterem/Spacją. `<details>` otwiera się Enterem.
4. Po każdej akcji, która zmienia treść (wyniki, błąd, zapis, krok formularza), fokus albo komunikat `aria-live` mówi użytkownikowi, co się stało.
5. Zrób to przy szerokości 390 px i 1280 px.

## Gdy skończysz

1. Commit po każdym zadaniu: `git commit -m "U2-3: …"` (numer zadania w opisie).
2. Na końcu utwórz `docs/agents/ux/<TWÓJ_ID>-DONE.md`: lista zadań z „zrobione / pominięte (dlaczego)”, wynik audytu (wklej podsumowanie), znane problemy.
3. `git push` na swoją gałąź.

## Prompt startowy (wklej agentowi, zmieniając ID)

> Jesteś agentem **U2** w zespole 4 agentów poprawiających UX/UI i dostępność aplikacji BezProgu.
> Przeczytaj kolejno: `docs/agents/ux/README.md`, `AGENTS.md`, `docs/agents/ux/U2-szukaj-karta.md`.
> Wykonaj zadania z briefu po kolei, dokładnie tak, jak są opisane — nie dodawaj własnych pomysłów.
> Zmieniaj wyłącznie pliki z Twojej listy. Po każdym zadaniu: `cd frontend && npx vite build`, potem commit
> z numerem zadania. Na końcu uruchom audyt z `tools/a11y` dla swoich tras, zrób test klawiaturą
> opisany w briefie, napisz `docs/agents/ux/U2-DONE.md` i zrób `git push`.

Pliki briefów: U1 → `U1-wspolne.md`, U2 → `U2-szukaj-karta.md`, U3 → `U3-trasa.md`, U4 → `U4-strony.md`.
Kolejność merge: **U1 → U2 → U3 → U4** (U1 zmienia style, z których korzystają pozostali; pliki się nie pokrywają,
więc agenci mogą pracować równolegle).
