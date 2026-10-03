# U3 — planowanie trasy (`/trasa`)

Gałąź `ux/u3-trasa`. Najpierw przeczytaj `docs/agents/ux/README.md`.
Twoje pliki: `frontend/src/pages/RoutePlanner.{jsx,css}`, `frontend/src/components/route/**`.

Trasy do audytu: `/trasa` oraz `/trasa?from=50.0684238,19.9478862&toPlace=5`.
Do testów wyniku: otwórz drugi adres i kliknij „Wyznacz trasę” (Kraków Główny → Sukiennice).
GraphHopper w Twoim stosie przy pierwszym starcie buduje graf ~5 min — wtedy zobaczysz stan 503
(też go testujesz, zadanie U3-6).

---

## U3-1. Usuń stare nadpisanie `summary` w bloku „Unikaj”

**Zrób dokładnie** w `pages/RoutePlanner.css`, w regule `.route-avoid summary`: usuń `display`,
`align-items`, `list-style`, `min-height` i wszelkie `::-webkit-details-marker`. Resztę zostaw.
(Strzałkę i 48 px dodaje globalnie agent U1.)

## U3-2. Uczciwe opcje „Unikaj”

**Problem:** „wysokie krawężniki”, „strome podjazdy” i „odcinki bez danych” NIE zmieniają przebiegu trasy
(GraphHopper nie zna krawężników, nie mamy danych wysokościowych) — tylko kostka brukowa zmienia trasę.
Użytkownik myśli, że trasa je omija. To łamie zasadę „nie udajemy pewności”.

**Zrób dokładnie** w `RoutePlanner.jsx` zmień `AVOID_OPTIONS` na:

```js
const AVOID_OPTIONS = [
  { key: 'cobblestone', label: 'kostka brukowa', hint: 'zmienia przebieg trasy' },
  { key: 'high_kerbs', label: 'wysokie krawężniki', hint: 'na razie tylko oznaczamy je w opisie trasy' },
  { key: 'steep', label: 'strome podjazdy', hint: 'brak danych o nachyleniu — jeszcze nie uwzględniamy' },
  { key: 'no_data', label: 'odcinki bez danych', hint: 'na razie tylko oznaczamy je w opisie trasy' },
]
```

W renderze każdej opcji, pod tekstem etykiety (wewnątrz tego samego `<label>`), dodaj
`<span className="route-avoid__hint" id={`avoid-hint-${o.key}`}>{o.hint}</span>`, a do `<input>` dodaj
`aria-describedby={`avoid-hint-${o.key}`}`. W CSS: `.route-avoid__hint { display: block; font-size: 0.875rem; color: var(--color-text-muted); }`.

## U3-3. Po wyznaczeniu trasy fokus na wynik

**Problem:** po „Wyznacz trasę” wynik pojawia się niżej, ale fokus zostaje na przycisku — użytkownik
klawiatury i czytnika nie wie, że coś się stało (komunikat `aria-live` na długim podsumowaniu bywa ucinany).

**Zrób dokładnie** w `components/route/RouteResult.jsx`: na początku wyniku dodaj
`<h2 className="route-result__title" tabIndex={-1} ref={titleRef}>Wynik: trasa bez schodów</h2>`
(bez `aria-live`). W `RouteResult` dodaj `useEffect(() => { titleRef.current?.focus() }, [])` — fokus
tylko raz, przy pierwszym pokazaniu wyniku. Z `<p className="route-summary">` usuń `aria-live`.
Sprawdź audytem, że nie ma przeskoku nagłówków (h1 „Zaplanuj trasę” → h2 „Wynik…”).

## U3-4. Nazwa punktu z linku zamiast „Wybrany punkt”

**Problem:** gdy trasa przychodzi z linku `?from=lat,lon`, pole „Skąd” pokazuje „Wybrany punkt” — nic nie mówi.

**Zrób dokładnie** w `RoutePlanner.jsx` w funkcji, która zwraca `{ label: 'Wybrany punkt', lat, lon }`:
label = `` `Punkt na mapie (${lat.toFixed(4)}, ${lon.toFixed(4)})` ``.

## U3-5. Kroki bez problemów mniej krzykliwe, problemy wyraźne

**Problem:** każdy z ~40 kroków to osobna karta z ramką — kroki z barierą giną w tłumie.

**Zrób dokładnie** w `components/route/RouteResult.css`:
- `.route-step--match` (kroki bez problemów): bez ramki i tła, tylko cienka linia oddzielająca
  (`border: 0; border-bottom: 1px solid var(--color-border); border-radius: 0; background: none;`),
  mniejszy odstęp (`padding: var(--space-2) 0`).
- `.route-step--barrier` i `.route-step--unknown`: zostają jako wyróżnione karty (obecny wygląd).
Nie zmieniaj ikon ani tekstów kroków (status nie może być tylko kolorem — ikony zostają).

## U3-6. Stan „usługa niedostępna” z przyciskiem ponowienia

**Zrób dokładnie** w `RoutePlanner.jsx`, w bloku `state === 'e503'` (ten z `role="alert"`), pod tekstem dodaj:
`<button type="button" className="btn" onClick={submitAgain}>Spróbuj ponownie</button>`, gdzie
`submitAgain` wywołuje tę samą funkcję co przycisk „Wyznacz trasę” z obecnymi punktami.
Dodaj zdanie: „Przy pierwszym uruchomieniu serwis tras przygotowuje mapę (kilka minut).”

## U3-7. Desktop: formularz i opis z lewej, mapa z prawej

**Problem:** przy 1280 px wszystko jest jedną kolumną, a mapa ukryta pod przełącznikiem.

**Zrób dokładnie:**
1. W `RouteResult.jsx` dodaj `const isDesktop = window.matchMedia('(min-width: 1024px)').matches`.
   Gdy `isDesktop`: nie pokazuj przełącznika „Opis / Mapa”, renderuj JEDNOCZEŚNIE listę kroków i mapę,
   mapę w `<div className="route-result__map">`.
2. W `RouteResult.css` w `@media (min-width: 1024px)`:
   ```css
   .route-result__body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-5); align-items: start; }
   .route-result__map { position: sticky; top: var(--space-4); height: 70vh; }
   ```
   (owiń listę kroków i mapę we wspólny `<div className="route-result__body">`; na telefonie ten div nic nie zmienia.)
3. Pod mapą zostaje zdanie „Te same informacje są w opisie trasy obok.”

**Sprawdź:** 1280 px — lista po lewej, mapa po prawej przyklejona; 390 px — jak dotąd, przełącznik „Opis / Mapa”.

## U3-8. Tryb „krok po kroku” — klawiatura

**Zrób dokładnie** w trybie prowadzenia (`guided`): po wejściu w tryb przenieś fokus na nagłówek kroku
(`tabIndex={-1}` + `focus()`), a po „Następny / Poprzedni” ponownie na nagłówek nowego kroku.
Gdy jesteś na ostatnim kroku, przycisk „Następny” ma być `disabled`, a obok przycisk „Zakończ prowadzenie”
wracający do listy (fokus na `h2` wyniku z U3-3).

---

## Na koniec

Audyt obu adresów bez błędów (poza wynikającymi z plików innych agentów — wypisz je).
Test klawiaturą 390 px: wpisz „Kraków Główny” w „Skąd” → Tab do wyniku → Enter → Tab do „Dokąd” →
„Sukiennice” → Enter → „Wyznacz trasę” → fokus na „Wynik…” → Tab przez kroki → „Rozpocznij…” → Następny ×3.
Zapisz w `U3-DONE.md`.
