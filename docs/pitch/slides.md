# BezProgu — konspekt prezentacji (maks. 10 slajdów)

1. **Problem.** Znaczek „dostępne” nic nie mówi osobie na wózku ani rodzicowi z wózkiem. Liczą się konkrety: stopnie, progi, szerokość drzwi, nawierzchnia.
2. **Grupa docelowa.** Osoby na wózkach i rodzice z wózkami w Krakowie — sprawdzanie w drodze, jedną ręką, przy słabym zasięgu. Nie pytamy o niepełnosprawność, tylko o bariery.
3. **Rozwiązanie.** Parametry zamiast werdyktu: Pasuje / Bariera / Brak danych, dopasowane do profilu zapisanego na urządzeniu.
4. **Demo: miejsce.** Profil „Wózek” → Sukiennice → karta: 3 stopnie (bariera), wejście boczne bez progu, dane sprzeczne i brak danych.
5. **Demo: trasa i zgłoszenie.** Opis krok po kroku z nawierzchnią i przeszkodami; zgłoszenie poprawki w < 1 min bez konta, od razu widoczne jako niezweryfikowane.
6. **Dane i wiarygodność.** Źródła: OSM, Otwarte Dane Krakowa, MSIP, dane.gov.pl, właściciele, użytkownicy. Sześć statusów, każdy fakt z datą i źródłem. Przykładowe dane oznaczone.
7. **Architektura.** Źródła → importery → fakty → ocena wiarygodności → API → www/widget/API. Pobór oddzielony od prezentacji; kolejne miasto to konfiguracja.
8. **Model biznesowy.** Darmo dla użytkowników. Obiekt Podstawowy 0 zł, Pro ~49 zł/mies. (widget, zdjęcia, statystyki), platformy i miasta indywidualnie. Płatność nie podnosi wiarygodności ani rankingu.
9. **Plan.** Hackathon → pilot (50 potwierdzonych obiektów) → usługa → skalowanie na kolejne miasta. Hosting ~200–400 zł/mies., operator: startup/NGO.
10. **Zespół i prośba.** Co umiemy, czego potrzebujemy: partnerzy-obiekty do pilota i miasto do integracji z portalem turystycznym.
