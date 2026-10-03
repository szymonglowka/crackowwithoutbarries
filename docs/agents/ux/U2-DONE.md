# U2 — szukaj + karta: DONE

Gałąź `ux/u2-szukaj-karta`. Stos: frontend http://localhost:5182, backend :8012, DB :5442
(`docker compose up -d --build db backend frontend`).

## Zadania

- [x] **U2-1** — usunięty `aria-label` z linku karty wyniku (`ResultCard.jsx`), dodane klasy
  `card-link` i `card-link__title`. Commit `ebbb74c`.
- [x] **U2-2** — słownik `RELIABILITY_SHORT` z pełnymi nazwami statusów. Commit `5509973`.
- [x] **U2-3** — wyniki partiami po 20 (`visible`, reset w efekcie pobierania, `slice(0, visible)`,
  przycisk „Pokaż więcej (N)” z przeniesieniem fokusu na pierwszą nową kartę, `aria-live`
  „Znaleziono N miejsc” bez zmian, markery i notka „Na mapie: te same {N} wyniki, co na liście.”.
  Commit `4078d24`.
- [x] **U2-4** — usunięte nadpisania `display/align-items/list-style/min-height/marker` z reguł
  `summary` w `Place.css` (kolory, padding, fonty zostawione). Commit `480f7e3`.
- [x] **U2-5** — nagłówki grup z licznikami (`X barier · Y brak danych · Z pasuje`, zera pomijane;
  sam „info” → `N parametrów (informacyjnie)`; `plural` dla barier i parametrów). Commit `5eb8d18`.
- [x] **U2-6** — przy `missing`: wartość to tylko `ReliabilityBadge`, źródło to tylko link
  „Pomóż uzupełnić”. Commit `0112f24`.
- [x] **U2-7** — `placeIsSample` przekazywany do `ParameterRow`; `SampleBadge` w wierszu tylko gdy
  `s.is_sample && !placeIsSample`. Baner na górze karty nietknięty. Commit `747b475`.
- [x] **U2-8** — layout `place__layout` > `place__main` + `aside.place__side[aria-label="Mapa i kontakt"]`
  (DOM: main, potem side); grid 2fr/1fr + sticky side + statyczny przycisk na desktopie;
  mapa domyślnie otwarta na desktopie (`open={isDesktop}`). Zweryfikowane: 390 px jedna kolumna,
  mapa zwinięta; 1280 px grid `757px 378px`, aside sticky po prawej, mapa otwarta. Commity `80b849e`,
  `6e5db9e` (patrz „Znany problem / poprawka” niżej).
- [x] **U2-9** — historia: „Pierwszy wpis: **tak**” dla `null`, strzałka w `aria-hidden` + tekst
  „zmiana na” dla czytnika, brak zdublowanego chipa wiarygodności, daty przez `formatDate`
  (daty już były przez `formatDate` — bez zmian). Etykiety statusów skopiowane lokalnie, bo
  `Badges.jsx` należy do U1. Commit `34ce926`.
- [x] **U2-10** — widget opakowany w `<main className="widget">`, jeden `<h1>` (nazwa miejsca).
  Commit `8b675e2`.
- [x] **U2-11** — label pinezek ze stanem (`markerLabel`: „Nazwa: X barier, Y pasuje[, Z brak danych]”,
  fallback do samej nazwy bez podsumowania; karta miejsca: „Nazwa: lokalizacja”).
  `MapView.jsx` bez zmian (już używa `label` w `title`/`alt`/tooltip). Commit `1c9dcc7`.

Pominięte: brak. Po każdym zadaniu `npx vite build` przeszedł i `rm -rf dist`.

## Znany problem / poprawka w U2-8 (ważne dla merge z U1)

Po przeniesieniu przycisku „Zgłoś zmianę lub błąd” do `aside` jego `position: sticky`
(telefon) nie miał już wysokiej szyny: Chrome przyklejał go do **góry** krótkiego `aside`,
przykrywając podsumowanie „Pokaż na mapie” (axe `target-size` serious, przycisk realnie
nieklikalny dotykiem). Powód potwierdzony pomiarami (przycisk na tych samych współrzędnych
co `summary`) i testem kontrolnym (stary DOM + style U1 = brak błędu).
Poprawka (commit `6e5db9e`, tylko `Place.css`): `.place__sticky { position: static; }` —
przycisk jest zwykłym końcowym elementem kolumny, w pełni osiągalny. Desktop dokładnie
według briefu. Pływający przycisk na telefonie znika — to zamierzony koszt (pływający
przycisk, który zasłania treść, jest gorszy).

## Audyt (`tools/a11y`, trasy z briefu)

`cd tools/a11y && BASE_URL=http://localhost:5182 npm run audit -- /szukaj "/szukaj?q=muzeum" /miejsce/5 /miejsce/5/historia /widget/5`

- `/widget/5`: **ok we wszystkich 3 rzutniach** (phone 390, zoom 320, desktop).
- Zero błędów: jeden `<h1>`, kolejność nagłówków, `<title>`, poziome przewijanie przy 320 px,
  pierwszy Tab → „Przejdź do treści”.
- Pozostałe 81 punktów to **wyłącznie**:
  1. `axe region` + małe cele w nawigacji/banerze prototypu („Sprawdź miejsce”, „Zaplanuj trasę”,
     „Jak to działa”, „FAQ”, „Zwiń informację o prototypie”) — pliki layoutu **agenta U1**, nie ruszane.
  2. Cele `<summary>` < 44 px na `/miejsce/5` (efekt U2-4). **Udowodnione symulacją po merge z U1**
     (tymczasowo podmieniony `base.css` z gałęzi `ux/u1-wspolne`, potem wycofane): reguła U1
     `details > summary { min-height: var(--tap); display: flex; … }` podnosi wszystkie podsumowania
     do 48 px i znikają one z listy błędów. Kolejność merge U1 → U2 to domyka.
  3. `axe target-size` na pinezkach Leaflet (desktop `/szukaj?q=muzeum`, spacing) — rozmiar/pozycje
     pinezek sprzed rundy, bez zmian w briefie; naprawa byłaby własnym pomysłem, więc pominięta.

## Test klawiaturą (skryptowany, klawisze Tab/Enter; brak frameworka testów we frontendzie)

- `/szukaj?q=muzeum`, 390 px i 1280 px: pierwszy Tab → „Przejdź do treści”; Tab do 3. karty →
  Enter → przejście na `/miejsce/470`; Tab przez grupy, Enter otwiera
  („Dojście i wejście: 4 brak danych · 1 pasuje”, „Wnętrze: 2 brak danych”,
  „Toaleta: 1 brak danych”, „Odpoczynek i udogodnienia: 2 parametry (informacyjnie)”).
- Potwierdzenie: na `/miejsce/1` — Tab do „2 cm” w „Byłem tam, potwierdzam” → Enter →
  komunikat `role="status"` „Dziękujemy! Twoje potwierdzenie zostało zapisane…”.
  (Na `/miejsce/5` brak parametru-konfliktu, więc nie ma tam przycisków potwierdzeń.)

## Uwagi o danych (nie blokery, do wiadomości)

- W moim stosie `/miejsce/5` to „Kraków Główny” (nie próbka); „Sukiennice (przykład)” mają ID 1
  (kolejność seed/importu). Audyt i briefowe trasy uruchomione dokładnie tak, jak nakazano.
- Testowy fakt z potwierdzenia klawiaturowego (ID 492) usunięty z dev-bazy; seed nietknięty.
- Brak committowanego testu: frontend nie ma żadnej uprzęży testowej (tylko `dev/build/preview`),
  a rundzie nie wolno instalować bibliotek. Weryfikacja: `vite build` + audyt + sondy klawiatury.
