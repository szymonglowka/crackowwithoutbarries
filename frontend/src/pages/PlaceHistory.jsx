// OWNER: A3 - see docs/agents/A3-search-place.md
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPlaceHistory } from '../api/places.js'
import { ErrorState, Loading, Empty } from '../components/PageStates.jsx'
import { ReliabilityBadge, SampleBadge, formatDate } from '../components/Badges.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './PlaceHistory.css'

// Kopia etykiet z Badges.jsx (plik agenta U1): badge jest zbędny, gdy źródło
// nazywa się identycznie (np. „Zgłoszenie użytkownika").
const RELIABILITY_LABELS = {
  confirmed: 'Potwierdzone',
  open_data: 'Z otwartych danych',
  user_report: 'Zgłoszenie użytkownika',
  conflicting: 'Sprzeczne',
  outdated: 'Może być nieaktualne',
  missing: 'Brak danych',
}

export default function PlaceHistory() {
  useDocumentTitle('Historia zmian')
  const { id } = useParams()
  const [state, setState] = useState({ status: 'loading', items: [], missing: false })

  useEffect(() => {
    let live = true
    getPlaceHistory(id)
      .then((items) => {
        if (live) setState({ status: 'ok', items: items ?? [], missing: false })
      })
      .catch((e) => {
        // /history/ lands with A1 - 404 means "not built yet", not an error.
        if (live) setState({ status: e?.status === 404 ? 'ok' : 'error', items: [], missing: e?.status === 404 })
      })
    return () => { live = false }
  }, [id])

  return (
    <div className="container page history">
      <h1>Historia zmian</h1>
      <p><Link to={`/miejsce/${id}`}>← Wróć do karty miejsca</Link></p>

      {state.status === 'loading' && <Loading lines={4} />}
      {state.status === 'error' && (
        <ErrorState>
          Nie udało się pobrać historii. <Link to={`/miejsce/${id}`}>Wróć do karty miejsca</Link>.
        </ErrorState>
      )}
      {state.status === 'ok' && state.missing && (
        <Empty title="Historia zmian nie jest jeszcze dostępna">
          <p>Zapisujemy każdą zmianę danych. Widok historii pojawi się tutaj, gdy tylko backend go udostępni.</p>
        </Empty>
      )}
      {state.status === 'ok' && !state.missing && (
        state.items.length === 0 ? (
          <Empty title="Brak zmian">
            <p>To miejsce nie ma jeszcze zapisanych zmian.</p>
          </Empty>
        ) : (
          <table className="history__table">
            <caption className="visually-hidden">Chronologiczna lista zmian danych</caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Parametr</th>
                <th scope="col">Zmiana</th>
                <th scope="col">Źródło</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((h, i) => (
                <tr key={i} className="history__row">
                  <td>{formatDate(h.date)}</td>
                  <td>{h.label ?? h.parameter}</td>
                  <td>
                    {h.old_value_display == null ? (
                      <>Pierwszy wpis: <strong>{h.new_value_display}</strong></>
                    ) : (
                      <>{h.old_value_display} <span aria-hidden="true">→</span><span className="visually-hidden">zmiana na</span> <strong>{h.new_value_display}</strong></>
                    )}
                    {h.note && <><br />{h.note}</>}
                  </td>
                  <td>
                    {h.source?.name}{' '}
                    {RELIABILITY_LABELS[h.reliability] !== h.source?.name && <ReliabilityBadge status={h.reliability} />}
                    {h.is_sample && <> <SampleBadge /></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  )
}
