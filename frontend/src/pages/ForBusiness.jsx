// OWNER: A4 - oferta dla firm (model biznesowy, 20%).
import { useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './ForBusiness.css'

const SEGMENTS = [
  { name: 'Hotele', points: ['Karta dostępności pokoju i wejścia na stronie rezerwacji — mniej telefonów z pytaniami.', 'Widżet z Twoimi potwierdzonymi danymi, zawsze aktualny.'] },
  { name: 'Organizatorzy wydarzeń', points: ['Informacja o barierach sali, toalet i dojścia przed zakupem biletu.', 'Mniej reklamacji i zwrotów po wydarzeniu.'] },
  { name: 'Zarządcy obiektów', points: ['Jeden profil obiektu dla wszystkich najemców i gości.', 'Raport luk w danych: co zmierzyć w pierwszej kolejności.'] },
  { name: 'Platformy i aplikacje mapowe', points: ['API z parametrami i statusami wiarygodności gotowe do osadzenia.', 'Dane wracają zweryfikowane przez użytkowników.'] },
]

export default function ForBusiness() {
  useDocumentTitle('Dla firm')
  const [sent, setSent] = useState(false)

  return (
    <div className="container page content">
      <h1>Dostępność, którą możesz pokazać swoim gościom</h1>
      <p className="lead">
        Goście na wózkach i rodzice z wózkami rezygnują z rezerwacji, gdy nie znają konkretów:
        ile stopni, jaki próg, jak szerokie drzwi. Pokaż im liczby zamiast znaczka.
      </p>
      <p><a className="btn btn--primary" href="mailto:partnerzy@bezprogu.pl?subject=Rozmowa%20o%20współpracy">Umów rozmowę</a></p>

      <section aria-labelledby="segmenty">
        <h2 id="segmenty">Dla kogo</h2>
        <div className="biz-grid">
          {SEGMENTS.map((s) => (
            <details key={s.name} className="card">
              <summary>{s.name}</summary>
              <ul>{s.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="widget">
        <h2 id="widget">Podgląd widgetu</h2>
        <p>
          Widget to ta sama karta parametrów, osadzona na Twojej stronie — z Twoimi potwierdzonymi danymi.
          Zobacz wersję testową: <a href="/widget-demo.html">/widget-demo.html</a> (jeśli dostępna w tym wdrożeniu).
        </p>
      </section>

      <section aria-labelledby="start">
        <h2 id="start">Jak zacząć</h2>
        <ol>
          <li>Załóż profil obiektu.</li>
          <li>Wprowadź lub potwierdź dane (pomożemy z pomiarami).</li>
          <li>Osadź widget na swojej stronie.</li>
        </ol>
      </section>

      <section aria-labelledby="cennik">
        <h2 id="cennik">Cennik (propozycja pilota)</h2>
        <div className="biz-grid">
          <div className="card"><h3>Obiekt Podstawowy — 0 zł</h3><p>Potwierdzenie własnych danych, karta w katalogu.</p></div>
          <div className="card"><h3>Obiekt Pro — ok. 49 zł/mies.</h3><p>Widget na własnej stronie, zdjęcia, statystyki wyświetleń.</p></div>
          <div className="card"><h3>Platformy i API — indywidualnie</h3><p>Licencja na osadzanie danych i API, miasta — wycena per miasto.</p></div>
        </div>
        <details><summary>Porównaj plany</summary>
          <p>Podstawowy: potwierdzenie danych + karta. Pro: dodatkowo widget, zdjęcia, statystyki. Platformy: dostęp API i SLA.</p>
        </details>
        <p className="notice notice--info"><strong>Gwarancja:</strong> płatny plan nigdy nie podnosi statusu wiarygodności ani pozycji w wynikach. Zaufanie mierzymy potwierdzeniami, nie fakturami.</p>
      </section>

      <section aria-labelledby="kontakt">
        <h2 id="kontakt">Kontakt</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true) }}
          action="mailto:partnerzy@bezprogu.pl" method="post" encType="text/plain"
        >
          <div className="field"><label htmlFor="biz-name">Imię i nazwisko</label><input id="biz-name" name="name" required autoComplete="name" /></div>
          <div className="field"><label htmlFor="biz-email">E-mail</label><input id="biz-email" name="email" type="email" required autoComplete="email" /></div>
          <div className="field">
            <label htmlFor="biz-type">Typ podmiotu</label>
            <select id="biz-type" name="type"><option>Hotel</option><option>Organizator wydarzeń</option><option>Zarządca obiektu</option><option>Platforma / aplikacja</option><option>Inny</option></select>
          </div>
          <div className="field"><label htmlFor="biz-msg">Wiadomość</label><textarea id="biz-msg" name="message" rows="4" required /></div>
          <button type="submit" className="btn btn--primary">Wyślij przez pocztę</button>
          {sent && <p aria-live="polite">Dziękujemy. Formularz otwiera Twoją aplikację pocztową — wiadomość trafia na partnerzy@bezprogu.pl.</p>}
        </form>
        <p><a href="/docs/pitch/submission.md">Pobierz opis dla partnerów (PDF w przygotowaniu — tymczasem opis tekstowy)</a></p>
      </section>
    </div>
  )
}
