# U1 — wspólne komponenty i style

Gałąź `ux/u1-wspolne`. Najpierw przeczytaj `docs/agents/ux/README.md`.
Twoje pliki: `frontend/src/styles/**`, `frontend/src/components/layout/**`, `Badges.jsx`, `StatusIcon.jsx`,
`PageStates.jsx`, `ProfileChip.jsx`. Twoje zmiany widać na KAŻDEJ stronie — testuj kilka stron.

Trasy do audytu: `/ /szukaj?q=muzeum /miejsce/5 /trasa /moje-potrzeby /dane /faq /dla-firm`.
Przed Tobą audyt pokazuje ~380 błędów; prawie wszystkie znikną po zadaniach U1-1 … U1-3.

---

## U1-1. Widoczny wskaźnik rozwijania dla każdego `<details>`

**Problem:** w całej aplikacji akordeony (`<details>`) wyglądają jak puste pola albo zwykłe ramki —
nie widać, że można je rozwinąć. Powód: style stron ustawiają `summary { display: flex }`, co usuwa
natywny trójkąt. Część `summary` ma też tylko 24 px wysokości („Transkrypcja”, „Porównaj plany”).

**Zrób dokładnie:** dopisz na końcu `frontend/src/styles/base.css`:

```css
/* Disclosure widgets: one consistent, visible expand indicator + 48 px target everywhere.
   The footer uses its own +/− marker (layout.css), so it is excluded here. */
details > summary {
  list-style: none;
  cursor: pointer;
  min-height: var(--tap);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
details > summary::-webkit-details-marker { display: none; }
details:not(.site-footer__section) > summary::after {
  content: "";
  flex-shrink: 0;
  margin-left: auto;
  width: 0.55em;
  height: 0.55em;
  border-right: 2.5px solid currentColor;
  border-bottom: 2.5px solid currentColor;
  transform: translateY(-25%) rotate(45deg);
}
details:not(.site-footer__section)[open] > summary::after {
  transform: translateY(25%) rotate(-135deg);
}
```

Nie zmieniaj plików stron — agenci U2–U4 usuną u siebie stare nadpisania `display` w `summary`.

**Sprawdź:** na `/faq`, `/dla-firm`, `/miejsce/5` każde pytanie/grupa ma strzałkę po prawej; po
otwarciu strzałka obraca się w górę; `summary` ma ≥48 px wysokości; stopka nadal ma „+ / −”.

## U1-2. Pasek „Prototyp” w landmarku i z dużym przyciskiem

**Problem:** axe zgłasza `region` na każdej stronie — tekst paska prototypu jest poza landmarkiem.
Przycisk „Zwiń” ma 40 px wysokości.

**Zrób dokładnie** w `frontend/src/components/layout/PrototypeBanner.jsx`: zamień zewnętrzny
`<div className="prototype-banner">` na `<aside className="prototype-banner" aria-label="Informacja o prototypie">`
(zamknij odpowiednio `</aside>`). W `layout.css` w regule `.prototype-banner .btn` zmień
`min-height: 40px` na `min-height: var(--tap)`.

**Sprawdź:** audyt nie zgłasza już `region`; przycisk ma 48 px wysokości.

## U1-3. Linki w stopce ≥48 px

**Problem:** linki w stopce mają 40 px wysokości.

**Zrób dokładnie** w `layout.css`: w regule `.site-footer li a` zmień `min-height: 40px` na
`min-height: var(--tap)`.

## U1-4. Zero barier ≠ czerwone ostrzeżenie

**Problem:** w wynikach wyszukiwania i na kartach chip „0 barier” jest czerwony z trójkątem
ostrzegawczym — straszy, choć to brak barier (albo brak wiedzy). To samo „0 pasuje” na zielono.

**Zrób dokładnie** w `frontend/src/components/Badges.jsx`:
1. Do `MatchBadge` dodaj opcjonalny prop `muted`. Gdy `muted` jest true: klasa `badge badge--muted`
   i ikona `<StatusIcon status="info" size={16} />` zamiast ikony statusu.
2. W `MatchSummary` przekaż `muted={summary.match === 0}` do chipu „pasuje” i
   `muted={summary.barrier === 0}` do chipu „barier”. Chip „brak danych” zostaw bez zmian.
3. W `base.css` dodaj: `.badge--muted { color: var(--color-text-muted); background: var(--color-bg); border-style: dashed; }`

**Sprawdź:** `/szukaj?q=muzeum` — „0 barier” jest szary z przerywaną ramką i ikoną „i”, nie czerwony.
Słowo nadal brzmi „0 barier” (nie zmieniaj tekstów).

## U1-5. Fokus nie może chować się pod przyklejonymi paskami (WCAG 2.4.11)

**Problem:** na telefonie dolny pasek nawigacji (64 px) i przyklejone przyciski („Zgłoś zmianę lub błąd”,
„Zapisz ustawienia”) mogą zasłaniać element z fokusem przy przechodzeniu Tabem.

**Zrób dokładnie** w `base.css` dodaj:

```css
/* Keep the focused element clear of the fixed bottom nav and sticky action bars (WCAG 2.4.11) */
html { scroll-padding-bottom: calc(var(--bottom-nav-h) + 96px); scroll-padding-top: var(--space-4); }
@media (min-width: 1024px) { html { scroll-padding-bottom: var(--space-5); } }
```

**Sprawdź:** `/moje-potrzeby` przy 390 px — Tab przez wszystkie pola: żadne pole z fokusem nie jest
ukryte pod „Zapisz ustawienia” ani pod dolnym paskiem.

## U1-6. Spójny wygląd kart-linków (hover i fokus)

**Problem:** karty, które są jednym dużym linkiem (wyniki wyszukiwania, „Dla firm →”), nie reagują
na najechanie — nie wyglądają na klikalne.

**Zrób dokładnie** w `base.css` dodaj klasę pomocniczą (agent U2 jej użyje):

```css
.card-link { display: block; color: inherit; text-decoration: none; }
.card-link:hover { border-color: var(--color-primary); box-shadow: 0 2px 8px rgb(0 0 0 / 0.12); }
.card-link:hover .card-link__title { text-decoration: underline; }
```

## U1-7. Ładowanie, błąd, pusto — czytelne komunikaty

**Zrób dokładnie** w `frontend/src/components/PageStates.jsx`:
1. `ErrorState`: dodaj opcjonalny prop `onRetry`. Gdy jest przekazany, pod tekstem pokaż
   `<button type="button" className="btn" onClick={onRetry}>Spróbuj ponownie</button>`.
2. `Empty`: tytuł renderuj jako `<h2>` (teraz jest `<strong>`), żeby czytnik mógł do niego przeskoczyć.
   Upewnij się, że na stronach, które używają `Empty`, nie powstaje przeskok nagłówków (audyt to sprawdzi).

## U1-8. Menu mobilne — pułapka fokusu

**Problem:** gdy menu pełnoekranowe jest otwarte, Tab może wyjść poza menu do strony pod spodem.

**Zrób dokładnie** w `frontend/src/components/layout/Header.jsx`, w efekcie, który obsługuje `Escape`
(gdy `open` jest true): obsłuż też `Tab`. Pobierz elementy fokusowalne w `#site-menu`
(`a[href], button`); jeśli fokus jest na ostatnim i wciśnięto Tab (bez Shift) → `preventDefault()`
i fokus na pierwszy; jeśli na pierwszym i Shift+Tab → fokus na ostatni.
Dodatkowo, gdy menu jest otwarte, dodaj `document.body.style.overflow = 'hidden'` i przywróć `''` po zamknięciu.

**Sprawdź:** otwórz menu (390 px), naciskaj Tab — fokus krąży tylko po pozycjach menu i „Zamknij”;
Esc zamyka i wraca na „Menu”.

---

## Na koniec

Uruchom audyt na wszystkich trasach (`npm run audit` bez argumentów). Zostać mogą tylko błędy
z plików innych agentów (np. `/widget/5` bez `<main>` — robi to U2). Wypisz je w `U1-DONE.md`.
