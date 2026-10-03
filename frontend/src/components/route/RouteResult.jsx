// OWNER: A2. Route result: summary, Opis/Mapa toggle, numbered steps, alt route, map.
import { Suspense, useState } from 'react'
import { MatchBadge, SampleBadge, formatDate } from '../Badges.jsx'
import StatusIcon from '../StatusIcon.jsx'
import { Loading } from '../PageStates.jsx'
import { LazyMap } from '../map/index.js'
import './RouteResult.css'

function stepStatus(step) {
  if (step.issues.some((i) => i.match === 'barrier')) return 'barrier'
  if (step.issues.some((i) => i.match === 'unknown')) return 'unknown'
  return 'match'
}

function Issue({ issue }) {
  return (
    <li className={`step-issue step-issue--${issue.match}`}>
      <MatchBadge match={issue.match} />
      <span>{issue.text} {issue.is_sample && <SampleBadge />}</span>
      <span className="step-issue__meta">
        {issue.source?.name}
        {issue.observed_at ? ` · ${formatDate(issue.observed_at)}` : ' · brak daty'}
      </span>
    </li>
  )
}

function Steps({ steps }) {
  if (!steps.length) return <p>Trasa nie ma osobnych odcinków do opisania.</p>
  return (
    <ol className="route-steps">
      {steps.map((s) => {
        const st = stepStatus(s)
        return (
          <li key={s.index} className={`route-step route-step--${st}`}>
            <p className="route-step__head">
              <StatusIcon status={st} size={20} />
              <strong>{s.index}. {s.instruction}</strong>
            </p>
            <p className="route-step__meta">
              {s.distance_m} m · nawierzchnia: {s.surface_display}
            </p>
            {s.issues.length > 0 && (
              <ul className="step-issues">
                {s.issues.map((issue, k) => <Issue key={k} issue={issue} />)}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function altText(main, alt) {
  const d = alt.distance_m - main.distance_m
  const len = d > 50 ? `Dłuższa o ${d} m` : d < -50 ? `Krótsza o ${-d} m` : 'Podobnej długości'
  // State exact counts - never claim the alternative "avoids" something it only reduces
  const a = alt.summary, m = main.summary
  const cob = a.difficult_surface < m.difficult_surface
    ? a.difficult_surface === 0
      ? ', ale omija trudną nawierzchnię'
      : `, ale ma mniej odcinków trudnej nawierzchni (${a.difficult_surface} zamiast ${m.difficult_surface})`
    : a.unknown < m.unknown
      ? `, ale ma mniej miejsc bez danych (${a.unknown} zamiast ${m.unknown})`
      : ''
  return `${len}${cob}.`
}

export default function RouteResult({ routes, activeId, onSelect }) {
  const [view, setView] = useState('opis')
  const [guided, setGuided] = useState(false)
  const [guideIdx, setGuideIdx] = useState(0)
  const active = routes.find((r) => r.id === activeId) ?? routes[0]
  const alt = routes.find((r) => r.id !== active.id)

  const issueMarkers = active.steps.flatMap((s) => {
    const bad = s.issues.find((i) => i.match === 'barrier' || i.match === 'unknown')
    if (!bad || !s.geometry.length) return []
    const mid = s.geometry[Math.floor(s.geometry.length / 2)]
    return [{ id: `s${s.index}`, lat: mid[0], lon: mid[1], label: `${s.index}. ${bad.text}`, match: bad.match }]
  })
  const lines = [
    { id: active.id, coords: active.geometry },
    ...(alt ? [{ id: alt.id, coords: alt.geometry, dashed: true }] : []),
  ]

  return (
    <section aria-label="Wyznaczona trasa">
      <p className="route-summary" aria-live="polite">
        <strong>{active.summary_text}</strong>
      </p>
      <p className="route-source">
        Dane trasy: OpenStreetMap. Krawężniki i przejścia oznaczone plakietką „Dane przykładowe”
        pochodzą z demonstracyjnego importu.
      </p>

      <div className="route-view-toggle" role="group" aria-label="Sposób pokazania trasy">
        <button type="button" aria-pressed={view === 'opis'} onClick={() => setView('opis')}>
          Opis
        </button>
        <button type="button" aria-pressed={view === 'mapa'} onClick={() => setView('mapa')}>
          Mapa
        </button>
      </div>

      {alt && (
        <div className="card alt-route">
          <p><strong>Trasa alternatywna.</strong> {altText(active, alt)}</p>
          <p className="alt-route__summary">{alt.summary_text}</p>
          <button type="button" className="btn" onClick={() => { onSelect(alt.id); setGuided(false); setGuideIdx(0) }}>
            Pokaż trasę alternatywną
          </button>
        </div>
      )}

      {view === 'mapa' ? (
        <div className="route-map">
          <Suspense fallback={<Loading />}>
            <LazyMap lines={lines} markers={issueMarkers} label="Mapa wyznaczonej trasy" />
          </Suspense>
          <p>Te same informacje są w opisie powyżej (przełącz na „Opis”).</p>
        </div>
      ) : guided ? (
        <Guided steps={active.steps} idx={guideIdx} onNav={setGuideIdx} onExit={() => setGuided(false)} />
      ) : (
        <>
          <button type="button" className="btn" onClick={() => { setGuided(true); setGuideIdx(0) }}>
            Rozpocznij prowadzenie krok po kroku
          </button>
          <Steps steps={active.steps} />
        </>
      )}
    </section>
  )
}

function Guided({ steps, idx, onNav, onExit }) {
  const s = steps[idx]
  if (!s) return null
  return (
    <div className="card guided" aria-live="polite">
      <p className="guided__count">Odcinek {idx + 1} z {steps.length}</p>
      <p className="guided__instruction"><strong>{s.instruction}</strong></p>
      <p>{s.distance_m} m · nawierzchnia: {s.surface_display}</p>
      {s.issues.length > 0 && (
        <ul className="step-issues">
          {s.issues.map((issue, k) => <Issue key={k} issue={issue} />)}
        </ul>
      )}
      <div className="guided__nav">
        <button type="button" className="btn" disabled={idx === 0} onClick={() => onNav(idx - 1)}>
          Poprzedni
        </button>
        <button type="button" className="btn" disabled={idx === steps.length - 1} onClick={() => onNav(idx + 1)}>
          Następny
        </button>
        <button type="button" className="btn" onClick={onExit}>
          Zakończ
        </button>
      </div>
    </div>
  )
}
