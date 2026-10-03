# Zgłoszenie formalne — BezProgu (Kraków bez barier)

## Opis rozwiązania i problemu

Znaczki „obiekt dostępny” nie pozwalają ocenić, czy dana osoba pokona stopnie, próg ani wąskie drzwi. BezProgu pokazuje konkretne parametry barier i udogodnień (stopnie, progi, podjazdy, windy, szerokość wejścia, nawierzchnia, toaleta, miejsca odpoczynku) dopasowane do profilu użytkownika. Zamiast werdyktu: Pasuje / Bariera / Brak danych — brak danych nigdy nie udaje dostępności, a dane przykładowe są zawsze oznaczone.

## Grupa docelowa i sposób użycia

Osoby na wózkach i rodzice z wózkami dziecięcymi. Scenariusz: wybór profilu barier (tylko na urządzeniu, bez pytania o niepełnosprawność) → wyszukanie miejsca lub trasy → karta z parametrami, źródłem, datą i statusem → opcjonalne zgłoszenie poprawki bez konta (< 1 min). Mobile first, pełna obsługa klawiaturą, tekstowe odpowiedniki map.

## Źródła danych, aktualność i wiarygodność

OpenStreetMap (ODbL), Otwarte Dane Krakowa, MSIP, dane.gov.pl, potwierdzenia właścicieli, zgłoszenia użytkowników. Każdy importer ma własny wiersz źródła ze statusem i datą synchronizacji; przy awarii stare dane zostają, a status zmienia się na „niedostępne”. Sześć statusów: Potwierdzone, Z otwartych danych, Zgłoszenie użytkownika, Sprzeczne, Może być nieaktualne (> 2 lat), Brak danych. Łączenie: najnowszy fakt ze źródła, ranking wiarygodności, przy konflikcie ostrzeżenie wygrywa. Fakty są dopisywane, nie nadpisywane; zweryfikowane poprawki wracają do OSM.

## Model biznesowy i rozwój

Darmo dla użytkowników. Obiekt Podstawowy 0 zł (potwierdzenie danych), Obiekt Pro ~49 zł/mies. (widget, zdjęcia, statystyki), platformy/API i miasta — wycena indywidualna. Płatność nie podnosi wiarygodności ani rankingu. Skalowanie: kolejne miasto to konfiguracja importerów, nie nowy projekt. Hosting ~200–400 zł/mies., operator: startup/NGO. Plan: hackathon → pilot (50 potwierdzonych obiektów) → usługa → kolejne miasta.
