// OWNER: A3. One search result: the whole card is a single link to /miejsce/:id.
import { Link } from 'react-router-dom'
import { MatchSummary, SampleBadge, formatDate } from '../Badges.jsx'
import './ResultCard.css'

const RELIABILITY_SHORT = {
  confirmed: 'potwierdzone',
  open_data: 'otwarte dane',
  user_report: 'zgłoszenie',
  conflicting: 'dane sprzeczne',
  outdated: 'może być nieaktualne',
  missing: 'brak danych',
}

/** Pin shape + card accent: barrier wins, then low data, else match. */
export function resultMatch(place) {
  if ((place.summary?.barrier ?? 0) > 0) return 'barrier'
  if (place.low_data) return 'unknown'
  return 'match'
}

export function formatDistance(m) {
  if (m == null) return null
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`
}

/** "Wejście boczne bez progu, potwierdzone 09.2026" style line. */
export function topFactLine(topFact) {
  if (!topFact) return null
  const when = topFact.observed_at
    ? new Date(`${topFact.observed_at}T00:00:00`).toLocaleDateString('pl-PL', { month: '2-digit', year: 'numeric' })
    : null
  const status = RELIABILITY_SHORT[topFact.status] ?? topFact.status
  return `${topFact.label}: ${topFact.value_display}${when ? `, ${status} ${when}` : ''}`
}

export default function ResultCard({ place, ...rest }) {
  return (
    <li
      className={`result-card result-card--${resultMatch(place)}`}
      data-place-id={place.id}
      {...rest}
    >
      <Link className="result-card__link card-link" to={`/miejsce/${place.id}`}>
        <span className="result-card__top">
          <span className="result-card__name card-link__title">{place.name}</span>
          {place.is_sample && <SampleBadge />}
        </span>
        <span className="result-card__meta">
          {place.category_label}
          {formatDistance(place.distance_m) && <> · {formatDistance(place.distance_m)}</>}
        </span>
        {place.summary && <MatchSummary summary={place.summary} />}
        {place.top_fact && <span className="result-card__fact">{topFactLine(place.top_fact)}</span>}
        {place.low_data && (
          <span className="result-card__low">Mało danych: oceń ostrożnie</span>
        )}
      </Link>
    </li>
  )
}
