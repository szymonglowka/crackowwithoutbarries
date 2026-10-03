// OWNER: A3. Parameter row: label/value, match badge, source + date, reliability.
// Mobile: stacked lines. Desktop (>=1024px): real table rows via CSS in Place.css.
import { Link } from 'react-router-dom'
import { MatchBadge, ReliabilityBadge, SampleBadge, formatDate } from '../Badges.jsx'

function SourceLine({ s }) {
  return (
    <span>
      {s.source.name}, potwierdzone {formatDate(s.observed_at)}
      {s.is_sample && <> <SampleBadge /></>}
    </span>
  )
}

export default function ParameterRow({ placeId, param, onConfirm, confirming }) {
  const [primary, ...rest] = param.sources ?? []
  const conflict = param.status === 'conflicting'
  const missing = param.status === 'missing'

  return (
    <tr className={`param ${conflict ? 'param--conflict' : ''}`}>
      <th scope="row" className="param__label">{param.label}</th>
      <td className="param__value">
        {missing ? (
          <>Brak danych <Link to={`/zglos?place=${placeId}&parameter=${param.key}`}>Pomóż uzupełnić</Link></>
        ) : (
          <strong>{param.value_display}</strong>
        )}
      </td>
      <td className="param__match">
        {/* "info" = profile doesn't constrain this parameter: no match verdict to show */}
        {param.match !== 'info' && <MatchBadge match={param.match} />}
        {param.match !== 'info' && param.requirement && <span className="param__req"> ({param.requirement})</span>}
      </td>
      <td className="param__source">
        {missing ? (
          <ReliabilityBadge status="missing" />
        ) : (
          <>
            <SourceLine s={primary} />
            {' '}<ReliabilityBadge status={param.status} />
            {conflict ? (
              <div className="param__all-sources">
                <p><strong>Wersje ze wszystkich źródeł:</strong></p>
                <ul>
                  {param.sources.map((s, i) => (
                    <li key={i}><SourceLine s={s} />: <strong>{s.value_display}</strong></li>
                  ))}
                </ul>
                <ConfirmButton placeId={placeId} param={param} onConfirm={onConfirm} confirming={confirming} />
              </div>
            ) : (
              rest.length > 0 && (
                <details className="param__more">
                  <summary>Inne źródła ({rest.length})</summary>
                  <ul>
                    {rest.map((s, i) => (
                      <li key={i}><SourceLine s={s} />: {s.value_display}</li>
                    ))}
                  </ul>
                </details>
              )
            )}
          </>
        )}
      </td>
    </tr>
  )
}

function ConfirmButton({ placeId, param, onConfirm, confirming }) {
  if (!onConfirm) {
    return (
      <p>
        <Link className="btn" to={`/zglos?place=${placeId}&parameter=${param.key}`}>
          Byłem tam, potwierdzam
        </Link>
      </p>
    )
  }
  // One button per distinct value: the visitor confirms the version they actually saw
  const versions = [...new Map(param.sources.map((s) => [JSON.stringify(s.value), s])).values()]
  return (
    <div className="param__confirm" role="group" aria-label={`Byłem tam — potwierdź: ${param.label}`}>
      <p><strong>Byłem tam, potwierdzam:</strong></p>
      {versions.map((s) => (
        <button key={JSON.stringify(s.value)} type="button" className="btn"
          onClick={() => onConfirm(param, s.value)} disabled={confirming}>
          {confirming ? 'Wysyłanie…' : s.value_display}
        </button>
      ))}
    </div>
  )
}
