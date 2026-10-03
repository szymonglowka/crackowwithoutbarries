# A4 — DONE

## Co działa

- **`/moje-potrzeby`** — intro (bariery, nie niepełnosprawność, tylko to urządzenie); 3 karty radio z presetów `profile_presets` z `/api/meta/` (fallback, gdy brak); ustawienia w 4 grupach (Wejście, Nawierzchnia, Wnętrze, Odpoczynek), liczby z przyciskami −/+ (bez suwaków), boole jako `role="switch"`; każde z `<details>` „Co to znaczy?”; przyklejony „Zapisz ustawienia” → `setProfile`, potwierdzenie w `aria-live`; edycja wartości przełącza preset na `custom`; sekcja synchronizacji (tekst) + link do `/prywatnosc`.
- **`/zglos`** — 3 kroki z licznikiem „Krok N z 3”; pre-fill z `?place=&parameter=`; bez `place` wyszukiwarka (`searchPlaces`); krok 1: parametry jako duże radio z `useMeta().parameters`; krok 2: obecna wartość read-only z `getPlace`, nowa wartość wg typu (number / tak-nie / enum select), opis, data obserwacji (domyślnie dziś), zdjęcie — tylko notka „wkrótce” + informacja o usuwaniu lokalizacji (nie udajemy wysyłki); krok 3: podsumowanie + opcjonalny e-mail; honeypot `website` (ukryty, `tabIndex=-1`); błędy przy polach + podsumowanie z fokusem; mapowanie DRF 400; ekran sukcesu z cytatem o „Zgłoszeniu użytkownika” i „Wróć do miejsca”.
- **`/`** — hero H1 „Nie »dostępne«. Konkretnie.”, przełącznik Wózek/Wózek dziecięcy (`aria-pressed`, ustawia preset), „Dokąd?” → `/szukaj?q=`, „Albo zaplanuj trasę →”, mockup karty (bez słowa „dostępne”, z `SampleBadge`); pigułki przykładowe z etykietą „przykład”; „Tak jest dziś vs Tak jest w BezProgu”; 3 kroki; legenda statusów ze `StatusIcon`; rozwidlenie Dla firm / Dla miast.
- **Treści**: `/dane` (statusy z `useMeta().reliability`, źródła na żywo z `/api/sources/` ze statusem/synchro/licencją — pokazuje też case „źródło niedostępne”, zasady łączenia z `matching.py`, „Gdy coś zawodzi”, przepływ poprawek, link do `/licencje`), `/dla-firm` (segmenty, widget `/widget-demo.html`, 3 kroki startu, cennik-propozycja, gwarancja o braku wpływu płatności, formularz `mailto:`), `/dla-miast` (architektura jako lista tekstowa, akordeony miasto/źródło/kategoria, licencje komponentów, utrzymanie z kosztami, roadmapa), `/jak-to-dziala`, `/faq` (wyszukiwarka + natywne `<details>`), `/dostepnosc`, `/prywatnosc` (5 zdań prostym językiem + pełna treść), `/regulamin`, `/licencje`. Wszystko po polsku, jeden H1, `useDocumentTitle`, `container page`, CSS obok komponentu, style od 360 px.
- **`docs/pitch/`** — `slides.md` (10 slajdów), `demo-script.md` (ścieżka jury 3 min), `submission.md` (sekcje formalne).
- Weryfikacja: `vite build` przechodzi (lokalnym binariuszem po `npm install` z cache w /tmp; `dist/` usunięty).

## Co nie działa / ograniczenia

- Brak Dockera w tym środowisku (odmowa dostępu do docker.sock) — **stosu nie uruchomiono ani nie klikano w przeglądarce**; strony pisane wg kontraktu z `docs/API.md` + `catalog.py`. Przed mergem kliknąć na żywym stacku 375 px i ≥1024 px samą klawiaturą.
- `POST /api/reports/` zależy od backendu A1 — do tego czasu `createReport` rzuca i formularz pokazuje `ErrorState`/błędy serwera (tak stanowi brief).
- Film i PDF dla partnerów to zaślepki tekstowe (napisy/transkrypcja „po nagraniu”).
- Zdjęcia w zgłoszeniu: UI + notka, bez wysyłki (zgodnie z briefem: „wkrótce”, bez udawania).

## Dla innych agentów

- Nie tykałem plików poza A4: tylko `frontend/src/pages/*` (moje), nowe `*.css` obok nich i `docs/pitch/*`. `api/reports.js` zostawione jak było (kontrakt się zgadza). `App.jsx` bez zmian — wszystkie trasy już były.
- A3: widget-demo — linkuję `/widget-demo.html` warunkowo („jeśli dostępna”); jak powstanie prawdziwy URL, daj znać to podmienię.
- A1: `/zglos` wysyła `{place, parameter, value, comment, observed_at, email, website}`; bool mapuję na tak/nie w UI, reszta jak w kontrakcie.
