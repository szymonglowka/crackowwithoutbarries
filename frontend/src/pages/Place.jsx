// OWNER: A3 - see docs/agents/A3-search-place.md
import { Suspense, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPlace } from '../api/places.js'
import { createReport } from '../api/reports.js'
import { Loading, ErrorState } from '../components/PageStates.jsx'
import { MatchSummary, ReliabilityBadge, SampleBadge, formatDate, plural } from '../components/Badges.jsx'
import ParameterRow from '../components/place/ParameterRow.jsx'
import { getRecentById, saveRecent } from '../components/place/recent.js'
import { LazyMap } from '../components/map/index.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { describeProfile, useProfile } from '../hooks/useProfile.js'
import './Place.css'

function groupCounts(group) {
  const barrier = group.parameters.filter((p) => p.match === 'barrier').length
  const unknown = group.parameters.filter((p) => p.match === 'unknown').length
  const match = group.parameters.filter((p) => p.match === 'match').length
  const parts = []
  if (barrier > 0) parts.push(`${barrier} ${plural(barrier, 'bariera', 'bariery', 'barier')}`)
  if (unknown > 0) parts.push(`${unknown} brak danych`)
  if (match > 0) parts.push(`${match} pasuje`)
  if (parts.length === 0) {
    const n = group.parameters.length
    return `${n} ${plural(n, 'parametr', 'parametry', 'parametrów')} (informacyjnie)`
  }
  return parts.join(' · ')
}

export default function Place() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile] = useProfile()
  useDocumentTitle('Karta miejsca')
  const [state, setState] = useState({ status: 'loading', place: null, offlineCopy: false })
  const [confirm, setConfirm] = useState({ key: null, msg: '', reportsDown: false })
  const [errorSummary, setErrorSummary] = useState('')

  const profileKey = JSON.stringify(profile.values)
  useEffect(() => {
    let live = true
    setState({ status: 'loading', place: null, offlineCopy: false })
    getPlace(id, profile.values)
      .then((place) => {
        if (!live) return
        saveRecent(place)
        setState({ status: 'ok', place, offlineCopy: false })
      })
      .catch(() => {
        if (!live) return
        const saved = getRecentById(id)
        if (saved) setState({ status: 'ok', place: saved.json, offlineCopy: true })
        else setState({ status: 'error', place: null, offlineCopy: false })
      })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profileKey])

  // "Byłem tam, potwierdzam": the user picks WHICH version they saw (conflicts have several).
  const confirmValue = async (param, value) => {
    setConfirm({ key: param.key, msg: '', reportsDown: false })
    try {
      await createReport({
        place: Number(id),
        parameter: param.key,
        value,
        observed_at: new Date().toISOString().slice(0, 10),
        website: '',
      })
      setConfirm({ key: null, msg: 'Dziękujemy! Twoje potwierdzenie zostało zapisane i jest widoczne jako zgłoszenie użytkownika.', reportsDown: false })
      // Refresh silently (no skeleton) so the new report shows up on the card
      getPlace(id, profile.values).then((place) => {
        saveRecent(place)
        setState({ status: 'ok', place, offlineCopy: false })
      }).catch(() => {})
    } catch (e) {
      if (e?.status === 404) {
        setConfirm({ key: null, msg: '', reportsDown: true })
        setErrorSummary(param.key)
      } else {
        setConfirm({ key: null, msg: 'Nie udało się wysłać potwierdzenia. Spróbuj ponownie.', reportsDown: false })
      }
    }
  }

  useEffect(() => {
    document.title = state.place ? `${state.place.name} · BezProgu` : 'Karta miejsca · BezProgu'
  }, [state.place])

  if (state.status === 'loading') {
    return (
      <div className="container page">
        <h1>Karta miejsca</h1>
        <Loading lines={6} />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="container page">
        <h1>Karta miejsca</h1>
        <ErrorState>
          Nie znaleźliśmy tego miejsca albo nie ma połączenia. <Link to="/szukaj">Wróć do wyszukiwarki</Link>.
        </ErrorState>
      </div>
    )
  }

  const place = state.place
  const hasStale = (place.groups ?? []).some((g) =>
    g.parameters.some((p) => p.status === 'outdated' || (p.sources ?? []).some((s) => s.outdated)),
  )

  return (
    <div className="container page place">
      {/* 1. back + title + address */}
      <button type="button" className="btn place__back" onClick={() => navigate(-1)}>← Wyniki</button>
      <h1>{place.name}</h1>
      <p className="place__addr">
        {place.category_label} · {place.address}{' '}
        <a
          href={`https://www.openstreetmap.org/directions?to=${place.lat},${place.lon}`}
          target="_blank"
          rel="noreferrer"
        >
          Nawiguj
        </a>{' '}
        <Link to={`/trasa?toPlace=${place.id}`}>Trasa tutaj</Link>
      </p>

      {state.offlineCopy && (
        <p className="notice notice--warning" role="alert">
          Wersja zapisana {formatDate(place.last_changed)}, możesz być offline.
        </p>
      )}

      {/* 2. sample banner */}
      {place.is_sample && (
        <p className="notice notice--warning" role="note">
          Dane przykładowe — ten obiekt służy do demonstracji.
        </p>
      )}

      {/* 3. match summary */}
      {place.summary && (
        <section aria-label="Dopasowanie do Twojego profilu">
          <MatchSummary summary={place.summary} />
          <p>
            Dla Twojego profilu »{describeProfile(profile)}« <Link to="/moje-potrzeby">Zmień profil</Link>
          </p>
        </section>
      )}

      {/* 4. key note */}
      {place.key_note && (
        <p className="place__keynote"><strong>Ważne:</strong> {place.key_note}</p>
      )}

      {confirm.msg && (
        <p className="notice notice--info" role="status" aria-live="polite">{confirm.msg}</p>
      )}

      {/* 5-6. groups */}
      {(place.groups ?? []).map((g) => {
        const hasBarrier = g.parameters.some((p) => p.match === 'barrier')
        const counts = groupCounts(g)
        return (
          <details key={g.key} open={hasBarrier} className="place__group">
            <summary>{g.label}{counts && `: ${counts}`}</summary>
            <table className="param-table">
              <caption className="visually-hidden">{g.label} — parametry i ich dopasowanie</caption>
              <tbody>
                {g.parameters.map((p) => (
                  <ParameterRow
                    key={p.key}
                    placeId={place.id}
                    param={p}
                    onConfirm={confirm.reportsDown ? null : confirmValue}
                    confirming={confirm.key === p.key}
                    placeIsSample={place.is_sample}
                  />
                ))}
              </tbody>
            </table>
            {confirm.reportsDown && errorSummary && g.parameters.some((p) => p.key === errorSummary) && (
              <p tabIndex={-1} ref={(el) => el?.focus()}>
                Zgłaszanie jest chwilowo niedostępne.{' '}
                <Link to={`/zglos?place=${place.id}&parameter=${errorSummary}`}>Zgłoś przez formularz</Link>.
              </p>
            )}
          </details>
        )
      })}

      {/* 7. map */}
      <details className="place__map">
        <summary>Pokaż na mapie</summary>
        <Suspense fallback={<Loading lines={2} />}>
          <LazyMap
            markers={place.lat != null ? [{ id: place.id, lat: place.lat, lon: place.lon, label: place.name }] : []}
            label={`Mapa: ${place.name}`}
          />
        </Suspense>
        <p>Wszystkie informacje z mapy są opisane powyżej.</p>
      </details>

      {/* 8. contact */}
      <section aria-label="Kontakt">
        <h2>Kontakt</h2>
        {hasStale && <p><strong>Zadzwoń przed wizytą</strong> — część danych może być nieaktualna.</p>}
        <p>
          {place.phone && <><a href={`tel:${place.phone.replace(/\s/g, '')}`}>{place.phone}</a><br /></>}
          {place.website && (
            <a href={place.website} target="_blank" rel="noreferrer">
              {place.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {!place.phone && !place.website && 'Brak danych kontaktowych.'}
        </p>
      </section>

      {/* 9. footer */}
      <footer className="place__footer">
        <p>Ostatnia zmiana: {formatDate(place.last_changed)}</p>
        <p>
          <Link to={`/miejsce/${place.id}/historia`}>Historia zmian</Link>
          {' · '}
          <Link to="/dla-firm">Jesteś właścicielem? Potwierdź dane</Link>
        </p>
        {(place.sources ?? []).length > 0 && (
          <ul className="place__sources">
            {(place.sources ?? []).map((s) => (
              <li key={s.key}>
                {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.name}</a> : s.name}
                {s.license && <> · licencja: {s.license}</>}{' '}
                <ReliabilityBadge status={s.default_reliability} />
              </li>
            ))}
          </ul>
        )}
        {place.osm_url && (
          <p>
            <a href={place.osm_url} target="_blank" rel="noreferrer">Zobacz w OpenStreetMap</a>
          </p>
        )}
      </footer>

      {/* 10. sticky report button */}
      <div className="place__sticky">
        <Link className="btn btn--primary btn--block" to={`/zglos?place=${place.id}`}>
          Zgłoś zmianę lub błąd
        </Link>
      </div>
    </div>
  )
}
