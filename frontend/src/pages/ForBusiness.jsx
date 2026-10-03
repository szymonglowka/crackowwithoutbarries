// OWNER: A4 - oferta dla firm (model biznesowy, 20%).
import { useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './ForBusiness.css'

const SEGMENTS = [
  { name: 'Hotele', pitch: 'Pokaż gościom na wózkach, czy wjadą do pokoju i restauracji — zanim zarezerwują.', points: ['Karta dostępności pokoju i wejścia na stronie rezerwacji — mniej telefonów z pytaniami.', 'Widżet z Twoimi potwierdzonymi danymi, zawsze aktualny.'] },
  { name: 'Organizatorzy wydarzeń', pitch: 'Podaj liczbę stopni do sali, szerokość przejść i dostęp do toalety — w opisie wydarzenia, przed zakupem biletu.', points: ['Informacja o barierach sali, toalet i dojścia przed zakupem biletu.', 'Mniej reklamacji i zwrotów po wydarzeniu.'] },
  { name: 'Zarządcy obiektów', pitch: 'Jeden profil z parametrami wejść, wind i toalet dla całego budynku — z listą braków do zmierzenia.', points: ['Jeden profil obiektu dla wszystkich najemców i gości.', 'Raport luk w danych: co zmierzyć w pierwszej kolejności.'] },
  { name: 'Platformy i aplikacje mapowe', pitch: 'Pobierz liczbę stopni, progów i szerokości drzwi z API — z oznaczeniem źródła i daty każdego faktu.', points: ['API z parametrami i statusami wiarygodności gotowe do osadzenia.', 'Dane wracają zweryfikowane przez użytkowników.'] },
]

export default function ForBusiness() {
  useDocumentTitle('Dla firm')
  const [sent, setSent] = useState(false)
  const [bizName, setBizName] = useState('')
  const [bizEmail, setBizEmail] = useState('')
  const [bizType, setBizType] = useState('Hotel')
  const [bizMsg, setBizMsg] = useState('')
  const [bizErrors, setBizErrors] = useState({})

  const submitBiz = (e) => {
    e.preventDefault()
    const errs = {}
    if (!bizName.trim()) errs.name = 'Podaj imię i nazwisko.'
    if (!bizEmail.trim()) errs.email = 'Podaj adres e-mail.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(bizEmail)) errs.email = 'Podaj poprawny adres e-mail.'
    if (!bizMsg.trim()) errs.message = 'Wpisz wiadomość.'
    setBizErrors(errs)
    const firstKey = ['name', 'email', 'message'].find((k) => errs[k])
    if (firstKey) {
      document.getElementById({ name: 'biz-name', email: 'biz-email', message: 'biz-msg' }[firstKey])?.focus()
      return
    }
    const subject = `Współpraca: ${bizType}`
    const body = [`Imię i nazwisko: ${bizName}`, `E-mail: ${bizEmail}`, `Typ podmiotu: ${bizType}`, '', bizMsg].join('\n')
    window.location.href = `mailto:partnerzy@bezprogu.pl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

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
            <div key={s.name} className="card">
              <p><strong>{s.name}:</strong> {s.pitch}</p>
              <details>
                <summary>Szczegóły</summary>
                <ul>{s.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </details>
            </div>
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
        <form onSubmit={submitBiz} noValidate>
          <div className="field">
            <label htmlFor="biz-name">Imię i nazwisko</label>
            <input id="biz-name" name="name" value={bizName} onChange={(e) => setBizName(e.target.value)} autoComplete="name"
              aria-invalid={!!bizErrors.name} aria-describedby={bizErrors.name ? 'biz-name-error' : undefined} />
            {bizErrors.name && <p className="biz-field-error" id="biz-name-error">{bizErrors.name}</p>}
          </div>
          <div className="field">
            <label htmlFor="biz-email">E-mail</label>
            <input id="biz-email" name="email" type="email" value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} autoComplete="email"
              aria-invalid={!!bizErrors.email} aria-describedby={bizErrors.email ? 'biz-email-error' : undefined} />
            {bizErrors.email && <p className="biz-field-error" id="biz-email-error">{bizErrors.email}</p>}
          </div>
          <div className="field">
            <label htmlFor="biz-type">Typ podmiotu</label>
            <select id="biz-type" name="type" value={bizType} onChange={(e) => setBizType(e.target.value)}><option>Hotel</option><option>Organizator wydarzeń</option><option>Zarządca obiektu</option><option>Platforma / aplikacja</option><option>Inny</option></select>
          </div>
          <div className="field">
            <label htmlFor="biz-msg">Wiadomość</label>
            <textarea id="biz-msg" name="message" rows="4" value={bizMsg} onChange={(e) => setBizMsg(e.target.value)}
              aria-invalid={!!bizErrors.message} aria-describedby={bizErrors.message ? 'biz-msg-error' : undefined} />
            {bizErrors.message && <p className="biz-field-error" id="biz-msg-error">{bizErrors.message}</p>}
          </div>
          <button type="submit" className="btn btn--primary">Przygotuj e-mail</button>
          {sent && <p role="status">Otworzyliśmy Twoją aplikację pocztową z gotową wiadomością. Wyślij ją stamtąd. Jeśli nic się nie otworzyło, napisz na partnerzy@bezprogu.pl.</p>}
        </form>
        <p><a href="/docs/pitch/submission.md">Pobierz opis dla partnerów (PDF w przygotowaniu — tymczasem opis tekstowy)</a></p>
      </section>
    </div>
  )
}
