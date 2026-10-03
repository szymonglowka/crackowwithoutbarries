// OWNER: A4 - oferta dla miast (skalowanie, 20%).
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './ForCities.css'

const ARCH = [
  ['Źródła', 'OpenStreetMap, Otwarte Dane Krakowa, MSIP, dane.gov.pl, właściciele obiektów, zgłoszenia użytkowników.'],
  ['Pozyskiwanie', 'Osobny importer na źródło; każdy ma własny wiersz Source ze statusem i datą synchronizacji.'],
  ['Normalizacja', 'Wszystko ląduje w jednym modelu faktów (places.Fact): parametr, wartość, źródło, data obserwacji.'],
  ['Ocena wiarygodności', 'Reguły łączenia: najnowszy fakt ze źródła, ranking wiarygodności, konflikty i przeterminowanie (2 lata).'],
  ['API', 'Jedno API: meta, miejsca, historia, zgłoszenia, trasy, geokodowanie. Miasto nie utrzymuje własnej bazy.'],
  ['Prezentacja', 'Strona www, osadzalny widget i API partnerskie — ten sam zestaw danych wszędzie.'],
]

export default function ForCities() {
  useDocumentTitle('Dla miast')
  return (
    <div className="container page content">
      <h1>Kolejne miasto to konfiguracja, nie nowy projekt</h1>
      <p className="lead">Miasto nie musi utrzymywać własnej bazy. Dostaje aktualne informacje, raport luk w danych i integrację z portalem turystycznym.</p>
      <p><a className="btn btn--primary" href="mailto:miasta@bezprogu.pl?subject=BezProgu%20dla%20miasta">Porozmawiajmy</a></p>

      <section aria-labelledby="dostaje">
        <h2 id="dostaje">Co miasto dostaje</h2>
        <ul>
          <li>Informację o barierach bez ręcznego utrzymywania bazy przez urząd.</li>
          <li>Raport luk w danych: które miejsca i parametry wymagają pomiaru.</li>
          <li>Integrację z portalem turystycznym (widget lub API).</li>
        </ul>
      </section>

      <section aria-labelledby="arch">
        <h2 id="arch">Architektura</h2>
        <ol className="cities-arch">
          {ARCH.map(([t, d]) => <li key={t}><strong>{t}:</strong> {d}</li>)}
        </ol>
      </section>

      <section aria-labelledby="dodac">
        <h2 id="dodac">Jak dodać…</h2>
        <details className="card"><summary>miasto</summary><p>Uruchom istniejące importery z nowym obszarem (granice miasta), dodaj lokalne zbiory otwarte jako nowe źródło. Bez zmian w kodzie prezentacji.</p></details>
        <details className="card"><summary>źródło</summary><p>Nowy importer + wiersz Source (status, synchronizacja, błędy). Przy awarii stare dane zostają, a status zmienia się na „niedostępne”.</p></details>
        <details className="card"><summary>kategorię miejsc</summary><p>Wpis w katalogu kategorii — bez migracji bazy, frontend pobiera listę z /api/meta/.</p></details>
      </section>

      <section aria-labelledby="lic">
        <h2 id="lic">Zależności i licencje</h2>
        <ul>
          <li>OpenStreetMap (ODbL, z atrybucją), Leaflet (BSD-2), GraphHopper (Apache 2.0), Django (BSD), PostGIS (GPL).</li>
          <li>Wszystko da się hostować samodzielnie — infrastruktura jest przenaszalna między operatorami.</li>
        </ul>
      </section>

      <section aria-labelledby="utrzymanie">
        <h2 id="utrzymanie">Utrzymanie</h2>
        <p>Operator: startup lub NGO. Hosting ok. 200–400 zł/mies. Aktualizacje importerów co 24 h. Bezpieczeństwo: HTTPS, zgłoszenia bez kont (hash zamiast IP). Obsługa zgłoszeń: moderacja społecznościowa + potwierdzenia właścicieli.</p>
      </section>

      <section aria-labelledby="plan">
        <h2 id="plan">Plan rozwoju</h2>
        <ol className="cities-arch">
          <li><strong>Hackathon:</strong> prototyp dla Krakowa.</li>
          <li><strong>Pilot:</strong> 50 potwierdzonych obiektów, pierwsi partnerzy.</li>
          <li><strong>Usługa:</strong> płatne plany Pro, utrzymanie zespołu.</li>
          <li><strong>Skalowanie:</strong> kolejne miasta tą samą konfiguracją.</li>
        </ol>
        <p>Kontakt: <a href="mailto:miasta@bezprogu.pl">miasta@bezprogu.pl</a> · Kod: repozytorium projektu (link w stopce).</p>
      </section>
    </div>
  )
}
