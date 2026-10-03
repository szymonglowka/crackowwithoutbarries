// OWNER: A3 (stretch goal). Embeddable compact card, rendered WITHOUT site chrome:
// <iframe src="https://.../widget/ID">. See frontend/public/widget-demo.html.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPlace } from '../api/places.js'
import { getMeta } from '../api/meta.js'
import { MatchSummary, MatchBadge, ReliabilityBadge, SampleBadge, formatDate } from '../components/Badges.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { DEFAULT_PROFILE } from '../hooks/useProfile.js'
import './Widget.css'

export default function Widget() {
  useDocumentTitle('Widget BezProgu')
  const { id } = useParams()
  const [preset, setPreset] = useState('wheelchair')
  const [presets, setPresets] = useState(null)
  const [places, setPlaces] = useState({})
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    getMeta().then((m) => setPresets(m.profile_presets)).catch(() => {})
  }, [])

  useEffect(() => {
    let live = true
    const values =
      presets?.[preset]?.values ??
      (preset === 'wheelchair' ? DEFAULT_PROFILE.values : { ...DEFAULT_PROFILE.values, max_steps: 1, needs_elevator: false })
    getPlace(id, values)
      .then((place) => {
        if (live) setPlaces((p) => ({ ...p, [preset]: place }))
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => { live = false }
  }, [id, preset, presets])

  const place = places[preset]
  // Show what matters for the chosen profile: barriers first, then unknowns, then matches
  const rank = { barrier: 0, unknown: 1, match: 2 }
  const topParams = (place?.groups ?? []).flatMap((g) => g.parameters)
    .filter((p) => p.match in rank)
    .sort((a, b) => rank[a.match] - rank[b.match])
    .slice(0, 4)

  return (
    <main className="widget">
      <p className="widget__brand">BezProgu · Kraków bez barier</p>
      {failed && <p className="notice notice--warning">Nie udało się pobrać danych.</p>}
      {!place && !failed && <p role="status">Wczytywanie…</p>}
      {place && (
        <>
          <h1 className="widget__name">{place.name} {place.is_sample && <SampleBadge />}</h1>
          <div className="widget__toggle" role="group" aria-label="Profil">
            <button type="button" aria-pressed={preset === 'wheelchair'} onClick={() => setPreset('wheelchair')}>
              Wózek
            </button>
            <button type="button" aria-pressed={preset === 'stroller'} onClick={() => setPreset('stroller')}>
              Wózek dziecięcy
            </button>
          </div>
          <MatchSummary summary={place.summary} />
          <ul className="widget__params">
            {topParams.map((p) => (
              <li key={p.key}>
                <span>{p.label}: <strong>{p.value_display ?? 'Brak danych'}</strong></span>{' '}
                <MatchBadge match={p.match} />{' '}
                {p.sources?.[0] && (
                  <span className="widget__src">
                    {p.sources[0].source.name}, {formatDate(p.sources[0].observed_at)}{' '}
                    <ReliabilityBadge status={p.status} />
                  </span>
                )}
              </li>
            ))}
          </ul>
          <a className="widget__full" href={`/miejsce/${place.id}`} target="_blank" rel="noreferrer">
            Pełna karta w BezProgu
          </a>
        </>
      )}
    </main>
  )
}
