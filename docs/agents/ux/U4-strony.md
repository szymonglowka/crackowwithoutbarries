# U4 — strona główna, profil potrzeb, zgłoszenie, strony informacyjne

Gałąź `ux/u4-strony`. Najpierw przeczytaj `docs/agents/ux/README.md`.
Twoje pliki: `frontend/src/pages/{Home,Needs,Report,HowItWorks,Data,ForBusiness,ForCities,Faq,AccessibilityStatement,Privacy,Terms,Licenses,NotFound}.{jsx,css}`.

Trasy do audytu: `/ /moje-potrzeby /zglos /zglos?place=5&parameter=threshold_cm /jak-to-dziala /dane /dla-firm /dla-miast /faq /dostepnosc /prywatnosc /regulamin /licencje /nie-ma-takiej-strony`.

---

## U4-1. Usuń stare nadpisania `summary`

**Problem:** agent U1 dodaje globalną strzałkę i wysokość 48 px dla `<details>`. Twoje style ją psują
(i przez nie „Transkrypcja” oraz „Porównaj plany” mają tylko 24 px).

**Zrób dokładnie:** w tych regułach usuń deklaracje `display`, `align-items`, `list-style`, `min-height`
oraz wszelkie `::-webkit-details-marker` / `::marker` (resztę zostaw):
- `pages/Faq.css` → `.faq-item summary`
- `pages/ForBusiness.css` → `.biz-grid summary`
- `pages/Data.css` → `.data-source summary`
- `pages/HowItWorks.css` → `.content details.card summary`
- `pages/Needs.css` → `.needs details summary`

## U4-2. Strona główna: makieta karty zgodna z prawdziwymi danymi

**Problem:** makieta „Sukiennice” na stronie głównej pokazuje „4 pasuje · 1 bariera · 2 brak danych”,
a prawdziwa karta (`/miejsce/5`, profil wózek) pokazuje „4 pasuje · 3 bariery · 1 brak danych”.
Blok „Tak jest w BezProgu” podaje źródła, których w danych nie ma („zgłoszenie użytkownika”, „z otwartych danych”).
Jury kliknie i zobaczy sprzeczność.

**Zrób dokładnie** w `pages/Home.jsx`:
1. Chipy makiety: `4 pasuje`, `3 bariery`, `1 brak danych` (w tej kolejności, te same komponenty co teraz).
2. Link „Zobacz kartę →” prowadzi do `/miejsce/5` (nie do wyszukiwania).
3. Lista w „Tak jest w BezProgu” — dokładnie te 4 pozycje:
   - „Stopnie przy wejściu głównym: 3 — potwierdził właściciel”
   - „Wejście boczne bez stopni — potwierdził właściciel”
   - „Szerokość drzwi: 85 cm — potwierdził właściciel”
   - „Przewijak: brak danych — nie zgadujemy”
4. Pod makietą mały tekst: „Dane przykładowe, profil: wózek.”

## U4-3. Strona główna: podwójna numeracja i pasek przykładów

**Zrób dokładnie** w `pages/Home.jsx`, w `<ol className="home-steps">`: usuń `<strong>1.</strong> `,
`<strong>2.</strong> `, `<strong>3.</strong> ` z początku pozycji (lista `<ol>` sama numeruje).
W `pages/Home.css` w `.home-pills` zamień `overflow-x: auto` na `flex-wrap: wrap` — przykłady mają się
zawijać do kolejnej linii zamiast uciekać poza ekran (przewijanie w bok jest niewidoczne i trudne na telefonie).

## U4-4. Profil potrzeb: desktop w dwóch kolumnach + podgląd

**Problem:** przy 1280 px `/moje-potrzeby` to jedna wąska kolumna i dużo pustego miejsca. Spec: grupy w dwóch
kolumnach i podgląd „Tak będzie wyglądała przykładowa karta z Twoim profilem”.

**Zrób dokładnie:**
1. W `pages/Needs.jsx` dodaj blok podglądu `<aside className="needs-preview" aria-labelledby="needs-preview-h">`
   z `<h2 id="needs-preview-h">Podgląd z Twoimi ustawieniami</h2>`. W środku: nazwa „Sukiennice (przykład)”,
   `MatchSummary` liczone na żywo: `getPlace(5, values)` z `api/places.js` (gdzie `values` to **aktualne,
   jeszcze niezapisane** wartości formularza), wywołanie z opóźnieniem 400 ms po zmianie; link „Zobacz pełną kartę” do `/miejsce/5`.
   Pod spodem `<p aria-live="polite">` z tekstem „Podgląd zaktualizowany: X pasuje, Y barier, Z brak danych.”
2. Kolejność w DOM: formularz, potem podgląd (na telefonie podgląd jest pod formularzem, nad sekcją synchronizacji).
3. W `pages/Needs.css` w `@media (min-width: 1024px)`:
   ```css
   .needs-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: var(--space-5); align-items: start; }
   .needs-groups { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
   .needs-preview { position: sticky; top: var(--space-4); }
   ```
   (owiń formularz + podgląd w `div.needs-layout`, a karty grup ustawień w `div.needs-groups`).

## U4-5. Zgłoszenie: błędy połączone z polami (WCAG 3.3.1, 1.3.1)

**Problem:** komunikat błędu stoi pod polem, ale pole nie jest z nim powiązane — czytnik nie przeczyta błędu
przy wejściu w pole, nie wie też, że pole jest błędne.

**Zrób dokładnie** w `pages/Report.jsx`:
1. Każdy komunikat błędu pola dostaje `id`: `report-place-error`, `report-parameter-error`, `report-new-error`,
   `report-date-error`, `report-email-error` (zarówno błędy z walidacji `errors.*`, jak i z serwera `fieldError`).
   Usuń z tych komunikatów `role="alert"` (alert jest już na podsumowaniu błędów — dwa alerty to szum).
2. Pola dostają `aria-invalid={!!błąd}` i `aria-describedby="<id błędu>"` (tylko gdy błąd istnieje).
   Dla radia parametrów: `aria-describedby` na `<fieldset>` grupy.
3. W podsumowaniu błędów na górze każdy błąd to link do pola: `<a href="#report-new">Podaj nową wartość.</a>`.
   Kliknięcie: `e.preventDefault(); document.getElementById(id)?.focus()`.

**Sprawdź:** krok 2 bez wartości → „Dalej” → fokus na podsumowaniu → Tab do linku → Enter → fokus w polu,
czytnik czyta „Nowa wartość, nieprawidłowe, Podaj nową wartość”.

## U4-6. Zgłoszenie: zmiana kroku przenosi fokus

**Zrób dokładnie:** nad treścią każdego kroku dodaj `<h2 tabIndex={-1} ref={stepHeadingRef}>` z tekstem:
krok 1 „Krok 1 z 3: miejsce i parametr”, krok 2 „Krok 2 z 3: co się zmieniło”, krok 3 „Krok 3 z 3: sprawdź i wyślij”.
Po przejściu „Dalej”/„Wstecz” (gdy NIE ma błędów) przenieś fokus na ten nagłówek. Usuń dotychczasowe
`<p aria-live="polite">Krok {step} z 3</p>` (nagłówek go zastępuje).

## U4-7. Zgłoszenie: parametry pogrupowane

**Zrób dokładnie:** w kroku 1 zamiast jednej długiej listy 14 radiów zrób osobny `<fieldset>` na każdą grupę
z `useMeta().groups` (Dojście i wejście, Wnętrze, Toaleta, Odpoczynek i udogodnienia), `<legend>` = nazwa grupy.
Wszystkie radia nadal mają `name="parameter"` (jedna wspólna grupa wyboru).

## U4-8. Zgłoszenie: podsumowanie w kroku 3 z jednostkami i datą PL

**Problem:** krok 3 pokazuje „Nowa wartość: 5” (bez „cm”) i datę „2026-10-03”.

**Zrób dokładnie:** w podsumowaniu (`dl.report-summary`):
- liczby z jednostką parametru (`paramDef.unit`): „5 cm”,
- `bool`: „tak” / „nie”,
- `enum`: etykieta z `paramDef.choices` (np. „kostka brukowa”, nie „sett”),
- data: `formatDate` z `components/Badges.jsx` → „03.10.2026”.

## U4-9. Dla firm: formularz kontaktowy nie może udawać wysyłki

**Problem:** `onSubmit` robi `preventDefault()` i pokazuje „Dziękujemy…”, ale NIC nie jest wysyłane
i aplikacja pocztowa się nie otwiera. Użytkownik myśli, że wiadomość poszła.

**Zrób dokładnie** w `pages/ForBusiness.jsx`:
1. W `onSubmit`: `e.preventDefault()`; zbuduj adres
   `mailto:partnerzy@bezprogu.pl?subject=${encodeURIComponent('Współpraca: ' + typ)}&body=${encodeURIComponent(treść)}`,
   gdzie treść = imię, e-mail, typ podmiotu i wiadomość w osobnych liniach; potem `window.location.href = adres`.
2. Dopiero wtedy pokaż komunikat (w `role="status"`): „Otworzyliśmy Twoją aplikację pocztową z gotową wiadomością.
   Wyślij ją stamtąd. Jeśli nic się nie otworzyło, napisz na partnerzy@bezprogu.pl.”
3. Przycisk nazwij „Przygotuj e-mail” (nie „Wyślij”).
4. Walidacja: puste wymagane pole albo zły e-mail → błąd pod polem z `id`, `aria-invalid`, `aria-describedby`
   (jak w U4-5) i fokus na pierwszym błędnym polu. Dodaj `noValidate` do `<form>`, żeby nie było dymków przeglądarki.

## U4-10. Dla miast: czytelne nagłówki akordeonów

**Zrób dokładnie** w `pages/ForCities.jsx`: nagłówek `h2` „Jak dodać…” → „Jak dodać kolejne miasto, źródło
lub kategorię”; teksty `summary`: „miasto” → „Kolejne miasto”, „źródło” → „Nowe źródło danych”,
„kategorię miejsc” → „Nowa kategoria miejsc”.

## U4-11. Dla firm: segmenty pokazują sens przed rozwinięciem

**Problem:** karty „Hotele”, „Organizatorzy wydarzeń”… to same nazwy w ramkach — wyglądają jak puste pola.

**Zrób dokładnie:** w `ForBusiness.jsx` pod każdym `summary` segmentu (poza `<details>`, przed nim
albo jako pierwszy widoczny tekst karty) pokaż jedno zdanie korzyści, widoczne bez rozwijania, np.
Hotele: „Pokaż gościom na wózkach, czy wjadą do pokoju i restauracji — zanim zarezerwują.”
Napisz po jednym takim zdaniu dla każdego segmentu (konkretnie, bez marketingowych ogólników).

## U4-12. „Skąd dane”: bez powtórzeń w kartach statusów

**Problem:** każda karta statusu ma ikonę + nazwę ORAZ pod spodem chip z tą samą nazwą i ikoną.

**Zrób dokładnie** w `pages/Data.jsx` (ok. linii 43): usuń `<ReliabilityBadge status={r.key} />` z karty
statusu. Zostaje ikona `StatusIcon` + pogrubiona nazwa + opis. Usuń nieużywany import, jeśli zostanie.

## U4-13. 404 z wyszukiwarką

**Zrób dokładnie** w `pages/NotFound.jsx`: pod tekstem dodaj formularz `role="search"` z polem
(`<label for="nf-q">Szukaj miejsca</label>`) i przyciskiem „Szukaj”, który przechodzi do `/szukaj?q=…`
(`useNavigate`). Zostaw istniejące linki.

---

## Na koniec

Audyt wszystkich Twoich tras bez błędów (poza błędami z plików innych agentów — wypisz je).
Test klawiaturą: `/zglos` bez parametrów → wybór miejsca → parametr → błąd w kroku 2 → poprawa → wysłanie
(zgłoszenie trafi do Twojej lokalnej bazy — to w porządku). `/moje-potrzeby`: zmiana profilu → podgląd się
aktualizuje i komunikat jest odczytany. Zapisz w `U4-DONE.md`.
