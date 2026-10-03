# Specyfikacja — wyzwanie „Kraków bez barier” + projekt BezProgu

Część A to treść wyzwania (wymagania i kryteria oceny). Część B to projekt podstron produktu BezProgu
(mobile first). Briefy agentów w `docs/agents/` odwołują się do numerów sekcji z części B.

---

# Część A — Wyzwanie

**Krótki opis:** Stwórz narzędzie, które pomoże mieszkańcom i turystom ocenić dostępność miejsc i tras
zgodnie z ich indywidualnymi potrzebami, a jednocześnie będzie źródłem informacji o dostępności oferty
miasta. Rozwiązanie powinno prezentować konkretne informacje o barierach i udogodnieniach, a jednocześnie
mieć potencjał do dalszego rozwoju, komercjalizacji i skalowania na inne miasta.

## 1. Kontekst

- Użytkownicy: osoby na wózkach, rodzice z wózkami dziecięcymi i inni, dla których schody, progi, wąskie
  wejścia czy nawierzchnia są przeszkodą.
- Problem to nie tylko brak informacji, ale sposób jej prezentowania. „Dostępne / niedostępne” nie
  wystarcza. Potrzebne są szczegóły: schody, progi, podjazdy, windy, szerokość wejścia, nawierzchnia,
  toaleta, miejsca odpoczynku — w miarę możliwości aktualne.
- Dane: otwarte źródła, OpenStreetMap, właściciele obiektów, zgłoszenia użytkowników. Trzeba wskazać
  źródło, datę aktualizacji i poziom wiarygodności. Informacje niepotwierdzone nie mogą być prezentowane
  jako formalne zapewnienie dostępności.
- Bez ręcznego utrzymywania bazy przez Miasto i bez dostępu do wewnętrznych systemów UMK / MJO.
- Proste w obsłudze i we wdrożeniu (hotele, organizatorzy wydarzeń). Potencjał poza Krakowem: inne miasta,
  właściciele obiektów, hotele, organizatorzy wydarzeń, zarządcy nieruchomości, systemy rezerwacyjne,
  dostawcy map i aplikacji turystycznych.

## 2. Wyzwanie

Prototyp narzędzia do sprawdzenia i oceny dostępności wybranych miejsc lub tras zgodnie z indywidualnymi
potrzebami — nie „dostępne/niedostępne”, tylko szczegóły pozwalające samodzielnie ocenić. Prototyp
ograniczony do wybranej grupy (u nas: osoby na wózkach i rodzice z wózkami dziecięcymi).

## 3. Oczekiwany rezultat — prototyp powinien

- prezentować jak najaktualniejsze informacje o barierach i udogodnieniach (schody, progi, podjazdy,
  windy, szerokość wejścia, nawierzchnia, toaleta, miejsca odpoczynku);
- wskazywać źródło informacji, datę aktualizacji i poziom wiarygodności;
- wykorzystywać dostępne źródła bez ręcznego utrzymywania bazy przez Miasto;
- nie wymagać dostępu do systemów UMK / MJO;
- uwzględniać potrzeby wybranej grupy;
- być łatwy w użyciu i wdrożeniu;
- pokazywać potencjał rozwoju, komercjalizacji i skalowania.

## 4. Wymagania formalne (zgłoszenie)

Opis rozwiązania i problemu; prototyp/demonstracja; grupa docelowa i sposób użycia; opis źródeł danych
i oceny ich aktualności i wiarygodności; model biznesowy i rozwój; prezentacja PDF (max 10 slajdów);
film max 3 min w otwartym repozytorium. Opcjonalnie: repozytorium kodu, zrzuty ekranu, link do demo.

## 5. Wymagania techniczne i organizacyjne

- Dowolna forma techniczna, ale musi pokazać główny scenariusz: wyszukanie miejsca lub trasy i
  informacje o dostępności dla wybranej grupy.
- **Architektura oddziela pozyskiwanie/aktualizację danych od prezentacji.** Wskazać komponenty, przepływ
  danych, sposób dodawania źródeł, kategorii miejsc i obszarów geograficznych.
- Publiczne dane na warunkach dostawców. Dla danych miejskich: konkretne zbiory / API, sposób pobierania,
  częstotliwość aktualizacji, postępowanie przy niedostępności źródła.
- **Przy każdej informacji: źródło, data pozyskania / ostatniego potwierdzenia, status wiarygodności.**
  Zgłoszenia użytkowników i inne niezweryfikowane dane wyraźnie odróżnione od potwierdzonych.
  Sposób poprawiania błędnych i nieaktualnych danych.
- **WCAG 2.2 AA jako cel.** W prototypie: obsługa klawiaturą i czytnikiem ekranu, czytelność, kontrast,
  tekstowa alternatywa dla informacji z mapy. Wykaz funkcji gotowych i wymagających dalszych prac.
- Model uruchomienia i utrzymania poza infrastrukturą UMK: kto odpowiada za hosting, aktualizacje,
  bezpieczeństwo, obsługę zgłoszeń, koszty.
- Ochrona danych: zakres zbieranych danych, ochrona zgłoszeń i kont, HTTPS. **Nie wymagać informacji o
  niepełnosprawności**, jeśli wystarczą preferencje dotyczące barier i udogodnień.
- Możliwość rozwijania przez inne podmioty: zależności od dostawców, licencje danych i komponentów,
  przenaszalność infrastruktury, sposób dodania kolejnego miasta.

## 6. Testowanie / walidacja na prezentacji

- Działająca demonstracja dla wybranej grupy: potrzeby → sprawdzenie min. jednego miejsca lub trasy →
  konkretne bariery i udogodnienia.
- Pokazać skąd są informacje, kiedy pozyskane/potwierdzone, jak oznaczamy dane niepełne, nieaktualne,
  niezweryfikowane. **Dane przykładowe muszą być jednoznacznie oznaczone.**
- **Min. jeden przypadek danych sprzecznych, niepełnych albo niedostępnego źródła** i co widzi
  użytkownik. Brak informacji ≠ potwierdzenie dostępności.
- Podstawowa kontrola dostępności głównego scenariusza: klawiatura, czytnik ekranu, kontrast, tekstowa
  wersja informacji z mapy. Ograniczenia prototypu i plan ich usunięcia.
- Plan przejścia od prototypu do usługi: podmiot odpowiedzialny, model pozyskiwania i weryfikacji danych,
  finansowanie hostingu i utrzymania, plan prac, warunki uruchomienia w kolejnym mieście.

## 7. Dostępne zasoby

- Otwarte Dane Miasta Krakowa — otwartedane.um.krakow.pl (JSON, CSV, XLSX, API).
- MSIP — msip.krakow.pl (WMS/WFS, warunki per zasób).
- dane.gov.pl — ogólnopolski katalog.
- OpenStreetMap — wymaga licencji ODbL i atrybucji.
- Inne otwarte źródła, właściciele obiektów, zgłoszenia użytkowników. Opublikowanie w internecie ≠ zgoda
  na automatyczne pobieranie i komercyjne użycie. Dla każdego źródła: pochodzenie, warunki, aktualność,
  sposób weryfikacji.

## 8. Kryteria oceny

| Kryterium | Waga |
|---|---|
| Związek z wyzwaniem i użyteczność dla grupy, łatwość użytkowania | 25% |
| Jakość i kompletność prototypu | 20% |
| Wiarygodność oraz sposób prezentacji i aktualizacji danych | 15% |
| Potencjał wdrożeniowy i skalowanie | 20% |
| Model biznesowy, komercjalizacja, rozwój rynkowy | 20% |

## 9. Kontekst wdrożeniowy

Duże znaczenie potencjału biznesowego. Kierunki komercjalizacji: usługi dla właścicieli obiektów, hoteli,
organizatorów wydarzeń, zarządców nieruchomości, systemów rezerwacyjnych, dostawców map i aplikacji
turystycznych.

---

# Część B — BezProgu: struktura podstron (mobile first)

Osoba na wózku albo rodzic z wózkiem sprawdza dostępność najczęściej w drodze, jedną ręką, przy słabym
zasięgu — dlatego każdą stronę projektujemy najpierw dla telefonu.

## Zasady mobile first

- Punkt wyjścia: ekran 360 px. CSS od wersji mobilnej, rozszerzenia `min-width`: 600 px (tablet),
  1024 px (desktop). Na telefonie jedna kolumna; druga od 600 px.
- **Strefa kciuka.** Najważniejsze akcje w dolnej połowie: dolny pasek nawigacji i przyklejone przyciski.
  Na górze tylko logo, tytuł i „Menu”. Cele dotykowe min. 48×48 px, odstęp min. 8 px.
- **Lista przed mapą.** Na telefonie domyślnie lista tekstowa, mapa jako opcja. Na desktopie obok siebie.
- **Wydajność i słaby zasięg.** Najpierw tekst i wyszukiwarka, mapa ładowana dopiero po przełączeniu.
  Ostatnio oglądane karty zapisane na urządzeniu i dostępne offline z informacją „Wersja zapisana [data],
  możesz być offline”.
- **Ruch i orientacja.** Brak animacji wymaganych do zrozumienia treści, respektowanie ograniczenia ruchu,
  pion i poziom, powiększenie tekstu do 200% bez przewijania w bok (WCAG 1.4.10).

## Mapa serwisu

```
/                       Strona główna
├── CZĘŚĆ APLIKACYJNA (dolny pasek nawigacji)
│   ├── /szukaj             Wyszukiwarka i wyniki (lista / mapa)
│   ├── /miejsce/[id]       Karta miejsca
│   │   └── /miejsce/[id]/historia   Historia zmian karty
│   ├── /trasa              Planowanie i wynik trasy
│   ├── /moje-potrzeby      Profil preferencji
│   └── /zglos              Zgłoszenie poprawki (3 kroki)
├── CZĘŚĆ INFORMACYJNA (menu)
│   ├── /jak-to-dziala      Jak korzystać, krok po kroku
│   ├── /dane               Źródła, licencje, statusy wiarygodności
│   ├── /dla-firm           Oferta, segmenty, cennik
│   ├── /dla-miast          Skalowanie, architektura, utrzymanie, plan rozwoju
│   └── /faq                Najczęstsze pytania
└── FORMALNE (stopka)
    ├── /dostepnosc         Deklaracja dostępności
    ├── /prywatnosc         Polityka prywatności
    ├── /regulamin
    └── /licencje           Licencje danych i komponentów
```

## Elementy wspólne (zbudowane w fundamencie — `components/layout/`)

- **Nagłówek:** 56 px, logo (→ strona główna), przycisk „Menu” z widocznym napisem. Nie przyklejony.
  Nad nim zwijany pasek „Prototyp: część danych to dane przykładowe”. Pierwszy element: „Przejdź do treści”.
- **Menu:** pełnoekranowa warstwa: Sprawdź miejsce, Zaplanuj trasę, Moje potrzeby | Jak to działa, Skąd dane,
  Dla firm, Dla miast, FAQ; „Zamknij”. Fokus na pierwszą pozycję, Esc zamyka, fokus wraca na „Menu”.
  Desktop: poziomy pasek + „Dla partnerów”.
- **Dolny pasek (część aplikacyjna):** Szukaj, Trasa, Moje potrzeby, Zgłoś; ikona + podpis; aktywna:
  pogrubienie, linia, `aria-current="page"`; safe-area. Desktop: znika.
- **Stopka:** akordeony (Produkt, Dane, Zasady, Kontakt) na telefonie, 4 kolumny na desktopie; zawsze
  widoczne: atrybucja OSM (ODbL), informacja o hackathonie, link do deklaracji dostępności.

## 1. Strona główna `/`

Cel: w 5 sekund pokazać, czym jest produkt, i dać możliwość wyszukania. ~5–6 ekranów telefonu.

1. **Hero.** H1 „Nie »dostępne«. Konkretnie.”, dwuzdaniowy podtytuł. Kompaktowa wyszukiwarka: przełącznik
   profilu jako dwa duże przyciski („Wózek” / „Wózek dziecięcy”), pole „Dokąd?”, przycisk „Sprawdź” na całą
   szerokość. Link „Albo zaplanuj trasę →”. Mockup karty miejsca pod wyszukiwarką.
2. **Szybkie przykłady.** Poziomy pasek „pigułek”: Sukiennice, Dworzec → Rynek, Kino Pod Baranami; znaczek
   „przykład” przy danych fikcyjnych. Przewijanie w bok tylko w pasku. Tab przechodzi po pigułkach.
3. **Problem w jednym ekranie.** „Tak jest dziś” (szara, „Dostępne ✓”) vs „Tak jest w BezProgu” (cztery
   konkretne parametry ze znaczkami źródeł). Link „Zobacz, jak to działa →”.
4. **Trzy kroki** (cyfra, ikona, zdanie). Desktop: 3 kolumny.
5. **Wiarygodność w pigułce.** Cztery ikony statusów (potwierdzone, otwarte dane, zgłoszenie, brak danych)
   + „Przy każdej informacji widzisz, skąd jest i kiedy ktoś ją sprawdził”. Link „Skąd bierzemy dane →”.
6. **Rozwidlenie dla partnerów.** „Prowadzisz hotel, muzeum lub wydarzenie?” → `/dla-firm`;
   „Reprezentujesz miasto?” → `/dla-miast`.
7. Stopka.

Tablet/desktop: hero w 2 kolumnach, karty problemu obok siebie, kroki w 3 kolumnach.

## 2. Wyszukiwarka i wyniki `/szukaj`

Cel: znaleźć miejsce i zobaczyć dopasowanie do profilu bez otwierania mapy.

**Stan początkowy:** pole wyszukiwania przyklejone; pod nim chip profilu „Profil: wózek · próg do 2 cm ·
drzwi min. 80 cm” + „Zmień” (→ `/moje-potrzeby`). Filtry kategorii (Muzea, Gastronomia, Noclegi, Toalety,
Urzędy) jako przewijane przyciski z `aria-pressed`. Przed wpisaniem: „Ostatnio oglądane” i „Popularne w
pobliżu” (lokalizacja dopiero po kliknięciu „Użyj mojej lokalizacji”).

**Wyniki:** przełącznik „Lista / Mapa” (domyślnie Lista); `aria-live`: „Znaleziono 12 miejsc”. Karta wyniku:
nazwa, kategoria, odległość, „5 pasuje · 1 bariera · 3 brak danych” (ikona + słowo), najważniejszy fakt
(„Wejście boczne bez progu, potwierdzone 09.2026”). Cała karta jednym linkiem. Sortowanie: najlepsze
dopasowanie, najbliższe, najlepiej udokumentowane. Miejsca z dużą ilością brakujących danych: szary pasek
„Mało danych: oceń ostrożnie” + „Pomóż uzupełnić”.

**Mapa:** między polem a dolnym paskiem. Pinezki o kształcie zależnym od dopasowania (okrąg, trójkąt,
przerywany okrąg). Kliknięcie → panel od dołu z kartą wyniku i „Szczegóły”. Notka „Te same wyniki są w
widoku listy”. Desktop: lista ~40% z lewej, mapa z prawej, podświetlanie karta ↔ pinezka.

## 3. Karta miejsca `/miejsce/[id]` — najważniejsza podstrona

1. „← Wyniki”, nazwa (H1), kategoria, adres + „Nawiguj”, „Zapisz”.
2. Baner danych przykładowych (bursztynowy, nie da się zamknąć).
3. Podsumowanie dopasowania: trzy liczby + „Dla Twojego profilu »wózek«” + „Zmień profil”. Bez słowa „dostępne”.
4. Najważniejsza uwaga, np. „Wejście główne ma 3 stopnie. Użyj wejścia od ul. Bocznej”.
5. Parametry w akordeonach: Dojście i wejście; Wnętrze; Toaleta; Odpoczynek i udogodnienia. Grupa z barierą
   rozwinięta, pozostałe zwinięte z licznikiem, np. „Toaleta: 1 brak danych”.
6. Parametr (4 linie): „Szerokość drzwi: **85 cm**” / „Pasuje (Twoje minimum: 80 cm)” / „Właściciel obiektu,
   potwierdzone 12.09.2026” / znaczek wiarygodności. „Inne źródła (2)”. Dane sprzeczne: czerwono‑bursztynowa
   obwódka, obie wersje widoczne, „Byłem tam, potwierdzam”.
7. „Pokaż na mapie” (zwinięte), wejścia zaznaczone; „Wszystkie informacje z mapy są opisane powyżej”.
8. Kontakt: telefon (link), www. Przy sprzecznych/starych danych: „Zadzwoń przed wizytą”.
9. „Ostatnia zmiana: [data]”, „Historia zmian”, „Jesteś właścicielem? Potwierdź dane” (→ `/dla-firm`).

Przyklejony przycisk nad dolnym paskiem: „Zgłoś zmianę lub błąd” (→ `/zglos` z wybranym miejscem).
Desktop: 2 kolumny; parametry jako tabela HTML z nagłówkami; z prawej mapa, kontakt, zgłoszenie (sticky).

**`/miejsce/[id]/historia`:** chronologiczna lista zmian: data, parametr, stara → nowa wartość, źródło,
zmiana statusu. Na telefonie karty.

## 4. Trasa `/trasa`

**Formularz:** „Skąd” (z „Moja lokalizacja”) i „Dokąd”, między nimi „Zamień”. Chip profilu + „Zmień”.
Zwinięty blok „Unikaj”: kostka brukowa, wysokie krawężniki, strome podjazdy, odcinki bez danych
(przełączniki z podpisem). „Wyznacz trasę” na całą szerokość.

**Wynik:**
1. Podsumowanie: „900 m, ok. 15 min · bez schodów · 1 odcinek trudnej nawierzchni · 1 przejście bez danych”.
2. „Opis / Mapa”, domyślnie Opis.
3. Numerowana lista kroków: co zrobić, nawierzchnia, przeszkoda, źródło i data. Kroki z problemem: ikona i
   obwódka. Brak danych wprost: „Brak danych o krawężniku. Nie wiemy, czy jest obniżony”.
4. Trasa alternatywna: „Dłuższa o 300 m, ale omija kostkę” + „Pokaż”.
5. Przyklejony „Rozpocznij” → tryb krok po kroku: jeden krok na ekran, duży tekst, „Poprzedni / Następny”.

Desktop: formularz i opis z lewej, mapa z prawej, synchronizowane podświetlenie kroku i odcinka.

## 5. Moje potrzeby `/moje-potrzeby`

1. „Powiedz nam, co jest dla Ciebie barierą. Nie pytamy o niepełnosprawność. Ustawienia zostają tylko na tym
   urządzeniu”.
2. Trzy duże karty: Wózek inwalidzki, Wózek dziecięcy, Własne ustawienia (wypełniają domyślne wartości).
3. Ustawienia (Wejście, Nawierzchnia, Wnętrze, Odpoczynek): pola liczbowe z − / + (bez suwaków): maks. próg
   (cm), min. szerokość drzwi (cm), maks. nachylenie (%), winda (tak/nie), dostosowana toaleta (tak/nie),
   ławka co najmniej co (m), unikanie kostki (tak/nie).
4. Przy każdym „Co to znaczy?” (zwinięte).
5. Przyklejony „Zapisz ustawienia” + komunikat dla czytnika.
6. „Synchronizacja między urządzeniami (opcjonalnie)” — wymaga konta; link do prywatności.

Desktop: grupy w 2 kolumnach + podgląd przykładowej karty z profilem.

## 6. Zgłoszenie `/zglos`

Cel: poprawić lub dodać informację w < 1 minutę, bez konta. „Krok 1 z 3” tekstem.
1. Miejsce (wstępnie wybrane, jeśli z karty) i parametr: duże radio — Wejście, Próg, Drzwi, Winda, Toaleta,
   Nawierzchnia, Inne.
2. Co się zmieniło: obecna wartość (odczyt), nowa wartość (liczba lub lista), opis (opcjonalnie), zdjęcie
   (opcjonalnie; lokalizacja z metadanych usunięta, twarze rozmyte), data obserwacji (domyślnie dziś).
3. Podsumowanie, „Wyślij”, opcjonalny e‑mail do powiadomienia.

Po wysłaniu: zgłoszenie od razu widoczne na karcie jako „niezweryfikowane”; status zmienia się po
potwierdzeniu przez innych lub właściciela. „Wróć do miejsca”. Błędy przy polu + podsumowanie błędów
z fokusem. Ochrona przed botami niewidoczna, bez zagadek.

## 7. Jak to działa `/jak-to-dziala`

H1 + wstęp; trzy kroki ze zrzutami (z tekstem alternatywnym); jak czytać kartę (numerowane objaśnienia
jako lista tekstowa); czego BezProgu nie robi (nie wydaje werdyktu „dostępne”, nie gwarantuje stanu
faktycznego, nie zgaduje przy braku danych); film (napisy, transkrypcja, bez autoodtwarzania);
„Sprawdź pierwsze miejsce” → `/szukaj`.

## 8. Skąd dane `/dane` (kryterium 15%)

1. H1 „Mówimy, co wiemy i czego nie wiemy”.
2. Spis treści z kotwicami (Statusy, Źródła, Łączenie źródeł, Gdy coś zawodzi, Poprawki).
3. Sześć statusów (Potwierdzone, Z otwartych danych, Zgłoszenie użytkownika, Sprzeczne, Może być
   nieaktualne, Brak danych) — ikona o unikalnym kształcie, nazwa, wyjaśnienie.
4. Źródła jako akordeony (OSM, Otwarte Dane Kraków, MSIP, dane.gov.pl, właściciele, użytkownicy): co
   bierzemy, sposób pobierania, częstotliwość, licencja, domyślny status. Bez szerokiej tabeli na telefonie.
5. Zasady łączenia źródeł.
6. Gdy coś zawodzi: dane sprzeczne, niepełne, źródło niedostępne — co widzi użytkownik.
7. Poprawianie danych: pionowa lista kroków; zwrot zweryfikowanych danych do OSM.
8. Link do `/licencje`.

## 9. Dla firm `/dla-firm` (model biznesowy)

1. H1 „Dostępność, którą możesz pokazać swoim gościom”, dwa zdania o utraconych rezerwacjach,
   „Umów rozmowę”.
2. Segmenty: Hotele, Organizatorzy wydarzeń, Zarządcy obiektów, Platformy i mapy — 2–3 korzyści + „Więcej”.
3. Podgląd widgetu karty dostępności na stronie hotelu (wersja mobilna).
4. Jak zacząć: załóż profil obiektu, wprowadź/potwierdź dane, osadź widget.
5. Cennik (propozycja): Za darmo dla użytkowników; Obiekt: Podstawowy / Pro; Platformy i miasta:
   indywidualnie. Na telefonie karty + „Porównaj plany”.
6. Gwarancja: płatny plan nie podnosi statusu wiarygodności ani pozycji w wynikach.
7. Formularz kontaktowy: imię, e‑mail, typ podmiotu, wiadomość (etykiety nad polami).
8. „Pobierz opis dla partnerów (PDF)”.

Desktop: segmenty 2×2, cennik w 3 kolumnach + tabela porównania.

## 10. Dla miast `/dla-miast` (skalowanie)

1. H1 „Kolejne miasto to konfiguracja, nie nowy projekt”, „Porozmawiajmy”.
2. Co miasto dostaje: informacja bez utrzymywania własnej bazy; raport luk w danych; integracja z portalem
   turystycznym.
3. Architektura (pionowo na telefonie): Źródła → Pozyskiwanie → Normalizacja → Ocena wiarygodności → API →
   Prezentacja, z pełnym opisem tekstowym.
4. Jak dodać miasto, źródło, kategorię (akordeony).
5. Zależności i licencje; przenaszalność infrastruktury.
6. Utrzymanie: produkt, hosting, aktualizacje, bezpieczeństwo, zgłoszenia, koszty.
7. Plan rozwoju: Hackathon → Pilot → Usługa → Skalowanie.
8. Kontakt i link do repozytorium.

## 11. FAQ `/faq`

„Szukaj w pytaniach”; sekcje: Dla użytkowników, Dane i wiarygodność, Prywatność, Dla właścicieli obiektów,
Dla miast; natywne `<details>/<summary>`; „Nie znalazłeś odpowiedzi? Napisz do nas”.

## 12. Strony formalne

- `/dostepnosc`: cel WCAG 2.2 AA, co działa, co wymaga prac (testy VoiceOver/TalkBack, pełna obsługa mapy
  klawiaturą, tekst łatwy do czytania), data audytu, zgłaszanie problemów.
- `/prywatnosc`: najpierw 5 zdań prostym językiem (co zbieramy, czego nie, gdzie są ustawienia, jak chronimy
  zgłoszenia, jak usunąć dane), potem pełna treść.
- `/licencje`: atrybucja OSM, licencje zbiorów miejskich, komponenty open source.
- `/regulamin`: zasady zgłaszania, moderacji i korzystania z API.

## Stany specjalne (każda podstrona aplikacyjna)

Ładowanie (szkielet + „Wczytywanie” dla czytnika); brak wyników (podpowiedzi); offline (baner + zapisane
karty); błąd źródła (komunikat + data ostatniej zapisanej wersji). 404 z wyszukiwarką i linkami.

## Ścieżka demonstracyjna dla jury (telefon)

Strona główna → profil „Wózek” → „Sukiennice” → lista z podsumowaniem dopasowania → karta z barierą,
wejściem alternatywnym, danymi sprzecznymi i brakiem danych → `/trasa` z opisem krok po kroku → zgłoszenie
poprawki → `/dane` z legendą statusów. Całość samą klawiaturą i czytnikiem ekranu.
