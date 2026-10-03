// OWNER: A4 - skąd dane i wiarygodność (kryterium 15%).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useMeta } from '../hooks/useMeta.js'
import { getSources } from '../api/meta.js'
import { formatDate } from '../components/Badges.jsx'
import StatusIcon from '../components/StatusIcon.jsx'
import { ErrorState, Loading } from '../components/PageStates.jsx'
import './Data.css'

export default function Data() {
  useDocumentTitle('Skąd dane')
  const meta = useMeta()
  const [sources, setSources] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSources().then(setSources).catch(setError)
  }, [])

  return (
    <div className="container page content">
      <h1>Mówimy, co wiemy i czego nie wiemy</h1>
      <nav aria-label="Spis treści">
        <ul>
          <li><a href="#statusy">Statusy wiarygodności</a></li>
          <li><a href="#zrodla">Źródła danych</a></li>
          <li><a href="#laczenie">Jak łączymy źródła</a></li>
          <li><a href="#zawodzi">Gdy coś zawodzi</a></li>
          <li><a href="#poprawki">Poprawianie danych</a></li>
        </ul>
      </nav>

      <section aria-labelledby="statusy">
        <h2 id="statusy">Statusy wiarygodności</h2>
        {!meta && <Loading lines={4} />}
        <ul className="data-statuses">
          {(meta?.reliability ?? []).map((r) => (
            <li key={r.key} className="card">
              <p><StatusIcon status={r.key} /> <strong>{r.label}</strong></p>
              <p>{r.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="zrodla">
        <h2 id="zrodla">Źródła danych</h2>
        {error && <ErrorState error={error}>Nie udało się pobrać listy źródeł. Poniżej opis ogólny.</ErrorState>}
        {!sources && !error && <Loading lines={3} />}
        {sources?.map((s) => (
          <details key={s.key} className="card data-source">
            <summary>
              {s.name}
              {s.status === 'unavailable'
                ? ' — źródło chwilowo niedostępne, pokazujemy ostatnie zapisane dane'
                : ''}
            </summary>
            <dl>
              <dt>Licencja</dt><dd>{s.license}</dd>
              <dt>Aktualizacja</dt><dd>{s.refresh_policy}</dd>
              <dt>Ostatnia synchronizacja</dt><dd>{s.last_sync_at ? formatDate(s.last_sync_at) : '—'}</dd>
              <dt>Domyślny status</dt><dd>{s.default_reliability}</dd>
              {s.url && <dt>Strona</dt>}
              {s.url && <dd><a href={s.url}>{s.url}</a></dd>}
            </dl>
          </details>
        ))}
        <p>Korzystamy z OpenStreetMap, Otwartych Danych Krakowa, MSIP i dane.gov.pl,
        a także z potwierdzeń właścicieli obiektów i zgłoszeń użytkowników.
        Zgłoszenia użytkowników są zawsze oznaczone i odróżnione od danych potwierdzonych.</p>
      </section>

      <section aria-labelledby="laczenie">
        <h2 id="laczenie">Jak łączymy źródła</h2>
        <ul>
          <li>Dla każdego parametru trzymamy najnowszy fakt z każdego źródła i pokazujemy je obok siebie.</li>
          <li>Wartość na karcie pochodzi z najbardziej wiarygodnego źródła (potwierdzone wyżej niż otwarte dane, te wyżej niż zgłoszenia).</li>
          <li>Gdy źródła się nie zgadzają, parametr oznaczamy jako sprzeczny i pokazujemy wszystkie wersje — a ostrzeżenie o barierze wygrywa z uspokojeniem.</li>
          <li>Fakty starsze niż 2 lata oznaczamy jako „Może być nieaktualne”.</li>
          <li>Brak danych to osobny stan — nigdy nie pokazujemy go jako potwierdzenia, że bariery nie ma.</li>
        </ul>
      </section>

      <section aria-labelledby="zawodzi">
        <h2 id="zawodzi">Gdy coś zawodzi</h2>
        <ul>
          <li><strong>Dane sprzeczne:</strong> czerwono-bursztynowa obwódka, obie wersje widoczne, przycisk „Byłem tam, potwierdzam”.</li>
          <li><strong>Dane niepełne:</strong> szary pasek „Mało danych: oceń ostrożnie” i link „Pomóż uzupełnić”.</li>
          <li><strong>Źródło niedostępne:</strong> zachowujemy ostatnie zapisane dane, pokazujemy datę ostatniej synchronizacji i komunikat, że odświeżenie się nie powiodło.</li>
        </ul>
      </section>

      <section aria-labelledby="poprawki">
        <h2 id="poprawki">Poprawianie danych</h2>
        <ol>
          <li>Zgłaszasz poprawkę w formularzu <Link to="/zglos">/zglos</Link> — bez konta, w mniej niż minutę.</li>
          <li>Zgłoszenie od razu widać na karcie jako „Zgłoszenie użytkownika” (niezweryfikowane).</li>
          <li>Status zmienia się po potwierdzeniu przez inne osoby lub właściciela obiektu.</li>
          <li>Zweryfikowane poprawki dotyczące przestrzeni publicznej przekazujemy z powrotem do OpenStreetMap.</li>
        </ol>
        <p><Link to="/licencje">Licencje danych i komponentów →</Link></p>
      </section>
    </div>
  )
}
