# U4 — DONE (strona główna, profil, zgłoszenie, strony informacyjne)

Gałąź `ux/u4-strony`. Wszystkie zadania U4-1–U4-13 wykonane, każde z osobnym
commitem (`npx vite build` przechodzi po każdym). Żaden plik spoza listy U4
nie został zmieniony.

## Zadania

- U4-1 zrobione — usunięte `display/align-items/list-style/min-height`
  z reguł `summary` w `Faq.css`, `ForBusiness.css`, `Data.css`,
  `HowItWorks.css`, `Needs.css` (reguł `::marker` w tych plikach nie było).
- U4-2 zrobione — `Home.jsx`: chipy `4 pasuje / 3 bariery / 1 brak danych`,
  link „Zobacz kartę →” do `/miejsce/5`, 4 pozycje „Tak jest w BezProgu”
  dokładnie wg briefu + dopisek „Dane przykładowe, profil: wózek.”
- U4-3 zrobione — usunięta podwójna numeracja w `home-steps`,
  `.home-pills`: `flex-wrap: wrap` zamiast `overflow-x: auto`.
- U4-4 zrobione — `Needs.jsx`: `aside.needs-preview` (`aria-labelledby`,
  `h2 „Podgląd z Twoimi ustawieniami"`, „Sukiennice (przykład)”,
  `MatchSummary` z `getPlace(5, draft)` z debounce 400 ms, link do
  `/miejsce/5`, `<p aria-live="polite">` zawsze w DOM — „Wczytywanie
  podglądu…” do czasu odpowiedzi API, potem „Podgląd zaktualizowany:
  X pasuje, Y …”. Kolejność DOM: formularz, podgląd (nad synchronizacją).
  `Needs.css`: siatka z briefu w `@media (min-width: 1024px)`.
- U4-5 zrobione — `Report.jsx`: id błędów `report-*-error` (walidacja
  i serwer), bez `role="alert"` na błędach pól, `aria-invalid` /
  `aria-describedby` na polach (radios: na `fieldset#report-parameters`
  z `tabIndex={-1}`), podsumowanie błędów to linki
  `e.preventDefault() + focus()`.
- U4-6 zrobione — `h2 tabIndex={-1} ref={stepHeadingRef}` z tytułami kroków,
  fokus po Dalej/Wstecz bez błędów, usunięte `<p>Krok {step} z 3</p>`.
- U4-7 zrobione — osobny `fieldset` na grupę z `useMeta().groups`
  (`legend` = nazwa grupy), wszystkie radia `name="parameter"`.
  Styl `.report-params-group` w `Report.css`.
- U4-8 zrobione — krok 3: liczby z `paramDef.unit` („5 cm”), bool
  „tak”/„nie”, enum z `paramDef.choices`, data przez `formatDate`
  („03.10.2026”).
- U4-9 zrobione — `ForBusiness.jsx`: submit buduje `mailto:` (temat
  „Współpraca: {typ}”, treść: imię / e-mail / typ / wiadomość) i ustawia
  `window.location.href`, komunikat w `role="status"` dokładnie wg briefu,
  przycisk „Przygotuj e-mail”, walidacja z błędami pod polami
  (`biz-*-error`, `aria-invalid/describedby`, fokus na pierwsze błędne),
  `noValidate` na formularzu.
- U4-10 zrobione — `ForCities.jsx`: h2 „Jak dodać kolejne miasto, źródło
  lub kategorię”, summary „Kolejne miasto / Nowe źródło danych /
  Nowa kategoria miejsc”.
- U4-11 zrobione — `ForBusiness.jsx`: każdy segment to `div.card` ze zdaniem
  korzyści widocznym bez rozwijania (`details/summary „Szczegóły"` poniżej).
- U4-12 zrobione — `Data.jsx`: usunięty `ReliabilityBadge` z kart statusów
  (zostaje `StatusIcon` + nazwa + opis) i nieużywany import.
- U4-13 zrobione — `NotFound.jsx`: formularz `role="search"`,
  `label „Szukaj miejsca"` + przycisk „Szukaj” → `/szukaj?q=…`.

Pominięte: brak.

## Audyt (`tools/a11y`, 14 tras U4 × 3 viewporty)

Uruchomiony przeciwko `vite --port 5184` (Docker niedostępny w tym
środowisku — patrz „Ograniczenia”). Wynik: **42 FAIL / 0 PASS,
281 problemów**, ale **żaden nie pochodzi z plików U4**:

- `axe region` + przycisk „Zwiń informację o prototypie” (`.prototype-banner`)
  oraz za małe linki nawigacji („Sprawdź miejsce”, „Zaplanuj trasę”,
  „Jak to działa”, „FAQ”) — pliki `components/layout/**`, właściciel U1.
- `<summary>` 24 px (m.in. „Co to znaczy?”, „Szczegóły”, „Kolejne miasto”,
  pytania FAQ, „Transkrypcja”) + 1× `axe target-size` na `summary`
  w `/moje-potrzeby` — to konsekwencja U4-1: lokalne `min-height: 48px`
  usunięte zgodnie z briefem, a globalny styl U1 (gałąź `ux/u1-wspolne`,
  jeszcze nie zmergowana) nie jest w tym drzewie. Kolejność merge
  U1→U2→U3→U4 to domyka; niczego nie przywracałem, żeby nie cofać U4-1.
- Brak błędów: jeden `<h1>`, kolejność nagłówków, tytuły stron, poziome
  przewijanie przy 320 px, skip link (pierwszy Tab → „Przejdź do treści”).

Pełny log: `/tmp/u4-audit.log` (zrzut z tej maszyny; w repo nie commitowany).

## Test klawiaturą (390 px i 1280 px, skrypt puppeteer, 14/14 OK)

- `/`: pierwszy Tab → „Przejdź do treści”, Enter → fokus w `#main` (oba viewporty).
- `/zglos` krok 1 bez wartości → „Dalej” → fokus na podsumowaniu
  (`role="alert"`), linki `#report-place` / `#report-parameters`,
  Enter na linku → fokus w polu, czytnik dostałby
  „nieprawidłowe + Podaj …” (`aria-invalid`, `aria-describedby`).
- `/moje-potrzeby`: aside po formularzu, link `/miejsce/5`, live-region w DOM.
- 404: `role="search"`, etykieta, „Szukaj” → `/szukaj?q=Sukiennice`.

## Ograniczenia (środowisko, nie kod)

- Docker (db/backend) nie działa w tej piaskownicy (`permission denied`
  na docker.sock, brak Dockera do zbudowania stosu), więc backendu nie było:
  pełny przepływ `/zglos` do wysyłki, liczby podglądu profilu na żywo
  i lista źródeł na `/dane` czekają na kliknięcie przy działającym backendzie
  (`docker compose up -d --build db backend frontend`, frontend :5184).
- `git push` wykonany; serwer deweloperski zatrzymany po audycie.

## Znane problemy

- Do merga U1 wszystkie `<details>` mają `summary` 24 px (audyt to wytyka) —
  naprawia to globalny styl U1, nie pliki U4.
