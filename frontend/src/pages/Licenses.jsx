// OWNER: A4 - licencje (spec B.12).
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './Licenses.css'

export default function Licenses() {
  useDocumentTitle('Licencje')
  return (
    <div className="container page content">
      <h1>Licencje danych i komponentów</h1>
      <section aria-labelledby="osm"><h2 id="osm">OpenStreetMap</h2>
        <p>Dane © autorzy OpenStreetMap, licencja ODbL 1.0, <a href="https://www.openstreetmap.org/copyright">openstreetmap.org/copyright</a>.</p>
      </section>
      <section aria-labelledby="miejskie"><h2 id="miejskie">Zbiory miejskie</h2>
        <ul><li>Otwarte Dane Krakowa — warunki per zbiór na otwartedane.um.krakow.pl.</li><li>MSIP (msip.krakow.pl) — usługi WMS/WFS, warunki per zasób.</li><li>dane.gov.pl — warunki per zbiór w katalogu krajowym.</li></ul>
      </section>
      <section aria-labelledby="komp"><h2 id="komp">Komponenty open source</h2>
        <ul><li>React, React Router, Vite; Leaflet (BSD-2); Django i DRF (BSD); PostGIS (GPL); GraphHopper (Apache 2.0).</li></ul>
      </section>
      <section aria-labelledby="wl"><h2 id="wl">Treści własne</h2>
        <p>Teksty serwisu i zdjęcia użytkowników za ich zgodą. Zgłoszenia użytkowników wnoszą wkład na warunkach jak dla OSM (zwrot zweryfikowanych danych do OSM).</p>
      </section>
    </div>
  )
}
