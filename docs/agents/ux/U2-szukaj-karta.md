# U2 — wyszukiwarka, karta miejsca, historia, widget

Gałąź `ux/u2-szukaj-karta`. Najpierw przeczytaj `docs/agents/ux/README.md`.
Twoje pliki: `frontend/src/pages/{Search,Place,PlaceHistory,Widget}.{jsx,css}`,
`frontend/src/components/place/**`, `frontend/src/components/map/**`.

Trasy do audytu: `/szukaj /szukaj?q=muzeum /miejsce/5 /miejsce/5/historia /widget/5`.
Sukiennice (przykład) to zawsze `/miejsce/5` — na niej testuj kartę (ma barierę, konflikt, braki, stare dane).

---

## U2-1. Czytnik ekranu musi usłyszeć całą kartę wyniku (najważniejsze!)

**Problem:** w `components/place/ResultCard.jsx` link ma `aria-label={`${place.name}, ${place.category_label}`}`.
`aria-label` ZASTĘPUJE całą treść linku — niewidomy słyszy tylko „Sukiennice, Muzea”, bez
„4 pasuje, 3 bariery, 1 brak danych” i bez najważniejszego faktu.

**Zrób dokładnie:** usuń atrybut `aria-label` z `<Link className="result-card__link" …>`. Nic więcej.
Dodaj klasę `card-link` obok `result-card__link` (styl hover dodaje agent U1; jeśli jeszcze go nie ma,
nic się nie zepsuje), a do `<span className="result-card__name">` dodaj klasę `card-link__title`.

**Sprawdź:** w Chrome DevTools → Elements → zaznacz link → zakładka Accessibility → „Name” zawiera
nazwę, liczby dopasowania i fakt.

## U2-2. Linia najważniejszego faktu — pełne słowa statusu

**Problem:** „Wejście bez stopni (główne lub alternatywne): tak, otwarte dane 10.2025” — „otwarte dane”
i „zgłoszenie” nie są nazwami statusów używanymi w reszcie aplikacji.

**Zrób dokładnie** w `ResultCard.jsx` zmień słownik `RELIABILITY_SHORT` na:

```js
const RELIABILITY_SHORT = {
  confirmed: 'potwierdzone',
  open_data: 'z otwartych danych',
  user_report: 'zgłoszenie użytkownika',
  conflicting: 'dane sprzeczne',
  outdated: 'może być nieaktualne',
  missing: 'brak danych',
}
```

## U2-3. Wyniki partiami po 20 („Pokaż więcej”)

**Problem:** `/szukaj?q=restauracja` renderuje setki kart naraz — użytkownik klawiatury musi przejść
Tabem przez każdą, a telefon długo przewija.

**Zrób dokładnie** w `pages/Search.jsx`:
1. Dodaj stan `const [visible, setVisible] = useState(20)`; resetuj go do 20 za każdym razem, gdy
   zmienia się zapytanie, kategoria albo sortowanie (w tym samym efekcie, który pobiera wyniki).
2. Listę renderuj z `fetch.results.slice(0, visible)`.
3. Pod listą, jeśli `fetch.results.length > visible`, pokaż
   `<button type="button" className="btn btn--block" onClick={showMore}>Pokaż więcej ({fetch.results.length - visible})</button>`.
4. `showMore`: zapamiętaj indeks `visible`, zwiększ `visible` o 20, a po renderze przenieś fokus na
   link w pierwszej nowo dodanej karcie (np. `requestAnimationFrame(() => document.querySelectorAll('.result-card__link')[oldVisible]?.focus())`).
5. Komunikat `aria-live` zostaw: „Znaleziono N miejsc” (N = wszystkie wyniki, nie tylko widoczne).
6. Mapa (widok „Mapa” i desktop) dostaje te same widoczne wyniki: `markers = fetch.results.slice(0, visible)`.
   Nad mapą zmień notkę na: „Na mapie: te same {N} wyniki, co na liście.” (N = liczba widocznych).

**Sprawdź:** `/szukaj?q=restauracja` — 20 kart, przycisk „Pokaż więcej (…)”, po kliknięciu fokus
na 21. karcie, mapa ma tyle pinezek, ile kart.

## U2-4. Usuń stare nadpisania `summary` (strzałka akordeonu)

**Problem:** agent U1 dodaje globalną strzałkę dla `<details>`; Twoje style ją psują.

**Zrób dokładnie** w `pages/Place.css` w regułach `.place__group > summary`, `.param__more > summary`,
`.place__map > summary` usuń deklaracje `display`, `align-items`, `list-style`, `min-height`
i wszelkie `::-webkit-details-marker` / `::marker` (resztę zostaw: kolory, padding, font).

**Sprawdź:** grupy „Wnętrze”, „Toaleta”, „Pokaż na mapie” mają strzałkę po prawej (po merge z U1).

## U2-5. Nagłówek każdej grupy mówi, co jest w środku

**Problem:** zwinięte grupy pokazują samo „Toaleta” albo „Odpoczynek i udogodnienia” — nie wiadomo, czy warto otwierać.

**Zrób dokładnie** w `pages/Place.jsx`, w miejscu, gdzie budujesz tekst `summary` grupy: zawsze
dopisuj liczniki w formacie `Nazwa grupy: X barier · Y brak danych · Z pasuje`, pomijając zera
(użyj funkcji `plural` z `Badges.jsx` dla „bariera/bariery/barier”). Jeśli wszystkie trzy są zerami
(sam „info”), napisz `Nazwa grupy: N parametrów (informacyjnie)`.
Przykłady: „Dojście i wejście: 3 bariery · 1 pasuje”, „Toaleta: 1 pasuje”, „Odpoczynek i udogodnienia: 3 parametry (informacyjnie)”.

## U2-6. „Brak danych” tylko raz w wierszu

**Problem:** przy brakującym parametrze (np. „Podjazd”) widać „Brak danych Pomóż uzupełnić” ORAZ
chip „Brak danych” w kolumnie źródła — dwa razy to samo.

**Zrób dokładnie** w `components/place/ParameterRow.jsx`, dla `missing`:
- komórka wartości (`param__value`): tylko `<ReliabilityBadge status="missing" />`,
- komórka źródła (`param__source`): tylko link `<Link to={`/zglos?place=${placeId}&parameter=${param.key}`}>Pomóż uzupełnić</Link>`.

## U2-7. Mniej szumu „Dane przykładowe” na karcie przykładowej

**Problem:** na `/miejsce/5` chip „Dane przykładowe” stoi przy każdym źródle w każdym wierszu (kilkanaście
razy), choć na górze jest już niezamykalny baner „Dane przykładowe — ten obiekt służy do demonstracji”.

**Zrób dokładnie:** przekaż do `ParameterRow` prop `placeIsSample={place.is_sample}` (z `Place.jsx`).
W `SourceLine` pokazuj `<SampleBadge />` tylko gdy `s.is_sample && !placeIsSample`. Dzięki temu
prawdziwe miejsce z przykładowym faktem (np. przykładowe potwierdzenie właściciela) nadal ma oznaczenie.
**Nie usuwaj** banera na górze karty.

## U2-8. Karta miejsca na desktopie w dwóch kolumnach

**Problem:** przy 1280 px karta to jedna długa kolumna; spec mówi: lewa — podsumowanie, uwaga, parametry;
prawa (przyklejona) — mapa, kontakt, zgłoszenie.

**Zrób dokładnie:**
1. W `Place.jsx` owiń treść w dwa kontenery: `<div className="place__main">` (nagłówek, baner przykładowy,
   podsumowanie, uwaga, grupy parametrów, stopka karty) i `<aside className="place__side" aria-label="Mapa i kontakt">`
   (blok mapy, kontakt, przycisk „Zgłoś zmianę lub błąd”). Oba w `<div className="place__layout">`.
   Kolejność w DOM: najpierw `place__main`, potem `place__side` (tak czyta czytnik i tak idzie Tab).
2. W `Place.css` w `@media (min-width: 1024px)`:
   ```css
   .place__layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); gap: var(--space-5); align-items: start; }
   .place__side { position: sticky; top: var(--space-4); }
   .place__sticky { position: static; }   /* przycisk zgłoszenia nie wisi już nad treścią */
   ```
3. Na desktopie blok „Pokaż na mapie” ma być domyślnie otwarty: `<details className="place__map" open={isDesktop}>`,
   gdzie `isDesktop = window.matchMedia('(min-width: 1024px)').matches` (licz raz przy renderze).
   Na telefonie zostaje zwinięty (mapa ładuje się dopiero po otwarciu — tak jak teraz).

**Sprawdź:** 1280 px — mapa i kontakt po prawej, przewijają się razem z ekranem; 390 px — wygląd bez zmian.

## U2-9. Historia zmian — czytelniej

**Zrób dokładnie** w `pages/PlaceHistory.jsx`:
1. Gdy `old_value_display` jest `null`, zamiast „— → tak” pokaż „Pierwszy wpis: **tak**”.
   W pozostałych przypadkach: „2 cm → **5 cm**” (strzałka `→` w `<span aria-hidden="true">` i dodatkowo
   `<span className="visually-hidden">zmiana na</span>`, żeby czytnik nie czytał „strzałka w prawo”).
2. Nie pokazuj `ReliabilityBadge`, gdy jego etykieta jest identyczna z nazwą źródła
   (źródło „Zgłoszenie użytkownika” + chip „Zgłoszenie użytkownika” = jedno wystarczy; zostaw nazwę źródła).
3. Daty formatuj `formatDate` z `Badges.jsx` (DD.MM.RRRR), jeśli jeszcze nie są.

## U2-10. Widget ma landmark `<main>`

**Problem:** audyt: `/widget/5` — brak `landmark-one-main` i `region`.

**Zrób dokładnie** w `pages/Widget.jsx`: najbardziej zewnętrzny element komponentu zamień na
`<main className="widget">` (zachowaj obecne klasy). Upewnij się, że w widgecie jest dokładnie jeden `<h1>` (nazwa miejsca).

## U2-11. Pinezki na mapie mają sensowne nazwy

**Zrób dokładnie** w `components/map/MapView.jsx`: `label` pinezki ma zawierać stan, nie tylko nazwę.
W miejscach, które budują `markers` (Search, Place), przekazuj `label` w formacie
`"Sukiennice (przykład): 3 bariery, 4 pasuje"` (dla karty miejsca: `"<nazwa>: lokalizacja"`).
W `MapView.jsx` nic nie zmieniaj poza ewentualnym użyciem tego `label` w `title`/`alt` (już tak jest).

---

## Na koniec

Audyt Twoich tras bez błędów. Test klawiaturą: `/szukaj?q=muzeum` → Tab do 3. karty → Enter → na
karcie miejsca Tab przez wszystkie grupy (Enter otwiera), „Byłem tam, potwierdzam” → „2 cm” (Enter)
→ komunikat „Dziękujemy…” odczytany. Zapisz wynik w `U2-DONE.md`.
