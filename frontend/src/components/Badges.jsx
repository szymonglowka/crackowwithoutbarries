import StatusIcon from './StatusIcon.jsx'

const RELIABILITY_LABELS = {
  confirmed: 'Potwierdzone',
  open_data: 'Z otwartych danych',
  user_report: 'Zgłoszenie użytkownika',
  conflicting: 'Sprzeczne',
  outdated: 'Może być nieaktualne',
  missing: 'Brak danych',
}

const MATCH_LABELS = { match: 'Pasuje', barrier: 'Bariera', unknown: 'Brak danych', info: 'Informacja' }

/** Reliability of a piece of data (icon + word). */
export function ReliabilityBadge({ status }) {
  return (
    <span className={`badge badge--${status}`}>
      <StatusIcon status={status} size={16} />
      {RELIABILITY_LABELS[status] ?? status}
    </span>
  )
}

/** How a parameter matches the user's profile (icon + word). */
export function MatchBadge({ match, children, muted }) {
  if (muted) {
    return (
      <span className="badge badge--muted">
        <StatusIcon status="info" size={16} />
        {children ?? MATCH_LABELS[match]}
      </span>
    )
  }
  return (
    <span className={`badge badge--${match}`}>
      <StatusIcon status={match} size={16} />
      {children ?? MATCH_LABELS[match]}
    </span>
  )
}

/** "Dane przykładowe" marker, required on every sample place/fact. */
export function SampleBadge() {
  return (
    <span className="badge badge--sample">
      <StatusIcon status="sample" size={16} />
      Dane przykładowe
    </span>
  )
}

/** "5 pasuje · 1 bariera · 3 brak danych" - never the word "dostępne". */
export function MatchSummary({ summary }) {
  return (
    <ul className="match-summary" aria-label="Dopasowanie do Twojego profilu">
      <li><MatchBadge match="match" muted={summary.match === 0}>{summary.match} pasuje</MatchBadge></li>
      <li><MatchBadge match="barrier" muted={summary.barrier === 0}>{summary.barrier} {plural(summary.barrier, 'bariera', 'bariery', 'barier')}</MatchBadge></li>
      <li><MatchBadge match="unknown">{summary.unknown} brak danych</MatchBadge></li>
    </ul>
  )
}

export function plural(n, one, few, many) {
  if (n === 1) return one
  const d = n % 10, dd = n % 100
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
