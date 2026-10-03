// OWNER: A3 - see docs/agents/A3-search-place.md
import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchPlaces } from '../api/places.js'
import { Loading, ErrorState, Empty } from '../components/PageStates.jsx'
import ProfileChip from '../components/ProfileChip.jsx'
import { SampleBadge, plural } from '../components/Badges.jsx'
import ResultCard, { formatDistance, resultMatch } from '../components/place/ResultCard.jsx'
import { getRecent } from '../components/place/recent.js'
import { LazyMap } from '../components/map/index.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useMeta } from '../hooks/useMeta.js'
import { useProfile } from '../hooks/useProfile.js'
import './Search.css'

const ORDERINGS = [
  { key: 'match', label: 'Najlepsze dopasowanie' },
  { key: 'distance', label: 'Najbliższe' },
  { key: 'documented', label: 'Najlepiej udokumentowane' },
]

function countText(n) {
  return `Znaleziono ${n} ${plural(n, 'miejsce', 'miejsca', 'miejsc')}`
}

/** "Sukiennice (przykład): 3 bariery, 4 pasuje" — pinezka mówi o stanie. */
function markerLabel(r) {
  if (!r.summary) return r.name
  const b = r.summary.barrier ?? 0
  const m = r.summary.match ?? 0
  const u = r.summary.unknown ?? 0
  const parts = [`${b} ${plural(b, 'bariera', 'bariery', 'barier')}`, `${m} pasuje`]
  if (u > 0) parts.push(`${u} brak danych`)
  return `${r.name}: ${parts.join(', ')}`
}

export default function Search() {
  useDocumentTitle('Szukaj miejsca')
  const [params, setParams] = useSearchParams()
  const urlQ = params.get('q') ?? ''
  const urlCat = params.get('category') ?? ''
  const [profile] = useProfile()
  const meta = useMeta()

  const [input, setInput] = useState(urlQ)
  const [ordering, setOrdering] = useState('match')
  const [near, setNear] = useState(null)
  const [locState, setLocState] = useState('idle') // idle|loading|ok|error
  const [view, setView] = useState('list')
  const [highlightId, setHighlightId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [fetch, setFetch] = useState({ status: 'idle', results: [], count: 0, error: null })
  const [visible, setVisible] = useState(20)
  const [recent] = useState(getRecent)
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)
  const debounce = useRef(null)

  // Home page submits here with ?q=... - pick it up.
  useEffect(() => { setInput(urlQ) }, [urlQ])

  useEffect(() => {
    const on = () => setOffline(!navigator.onLine)
    window.addEventListener('online', on)
    window.addEventListener('offline', on)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', on)
    }
  }, [])

  // Debounced: typing updates the URL, the URL drives the fetch.
  const onInput = (v) => {
    setInput(v)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      setParams((p) => {
        const next = new URLSearchParams(p)
        if (v) next.set('q', v)
        else next.delete('q')
        return next
      }, { replace: true })
    }, 350)
  }

  const toggleCategory = (key) => {
    setParams((p) => {
      const next = new URLSearchParams(p)
      if (next.get('category') === key) next.delete('category')
      else next.set('category', key)
      return next
    }, { replace: true })
  }

  const profileKey = JSON.stringify(profile.values)
  const showMore = () => {
    const oldVisible = visible
    setVisible((v) => v + 20)
    requestAnimationFrame(() => document.querySelectorAll('.result-card__link')[oldVisible]?.focus())
  }
  useEffect(() => {
    setVisible(20)
    if (!urlQ && !urlCat) {
      setFetch({ status: 'idle', results: [], count: 0, error: null })
      return
    }
    setFetch({ status: 'loading', results: [], count: 0, error: null })
    let live = true
    searchPlaces({
      q: urlQ || undefined,
      category: urlCat || undefined,
      profile: profile.values,
      ordering,
      near: near ? `${near.lat},${near.lon}` : undefined,
    })
      .then((data) => {
        if (!live) return
        setFetch({ status: 'ok', results: data.results /* ordered by the API */, count: data.count, error: null })
      })
      .catch((error) => {
        if (live) setFetch({ status: 'error', results: [], count: 0, error })
      })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ, urlCat, ordering, near, profileKey])

  const askLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocState('error')
      return
    }
    setLocState('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNear({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setLocState('ok')
      },
      () => setLocState('error'),
      { timeout: 10000 },
    )
  }

  const markers = fetch.results.slice(0, visible)
    .filter((r) => r.lat != null && r.lon != null)
    .map((r) => ({ id: r.id, lat: r.lat, lon: r.lon, label: markerLabel(r), match: resultMatch(r) }))
  const selected = fetch.results.find((r) => r.id === selectedId)

  return (
    <div className="container page search">
      <h1>Szukaj miejsca</h1>

      <form role="search" className="search__bar" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="search-q">Dokąd?</label>
          <input
            id="search-q"
            type="search"
            autoComplete="off"
            placeholder="Np. Sukiennice, kino, muzeum…"
            value={input}
            onChange={(e) => onInput(e.target.value)}
          />
        </div>
      </form>
      <ProfileChip />

      {offline && (
        <p className="notice notice--warning" role="alert">
          Jesteś offline. Pokazujemy ostatnio zapisane wyniki.
        </p>
      )}

      <div className="search__cats" role="group" aria-label="Filtruj po kategorii">
        {(meta?.categories ?? []).map((c) => (
          <button
            key={c.key}
            type="button"
            className="btn search__cat"
            aria-pressed={urlCat === c.key}
            onClick={() => toggleCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="search__tools">
        <div className="field search__sort">
          <label htmlFor="search-sort">Sortowanie</label>
          <select id="search-sort" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
            {ORDERINGS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="search__view" role="group" aria-label="Widok wyników">
          <button type="button" className="btn" aria-pressed={view === 'list'} onClick={() => setView('list')}>
            Lista
          </button>
          <button type="button" className="btn" aria-pressed={view === 'map'} onClick={() => setView('map')}>
            Mapa
          </button>
        </div>
      </div>

      {ordering === 'distance' && locState !== 'ok' && (
        <p>
          <button type="button" className="btn" onClick={askLocation} disabled={locState === 'loading'}>
            {locState === 'loading' ? 'Ustalam lokalizację…' : 'Użyj mojej lokalizacji'}
          </button>{' '}
          {locState === 'error' && <span>Nie udało się ustalić lokalizacji.</span>}
        </p>
      )}

      <div aria-live="polite" role="status" className="visually-hidden">
        {fetch.status === 'ok' ? countText(fetch.count) : fetch.status === 'loading' ? 'Wczytywanie wyników' : ''}
      </div>

      {fetch.status === 'idle' && (
        <section aria-labelledby="recent-h">
          <h2 id="recent-h">Ostatnio oglądane</h2>
          {recent.length === 0 ? (
            <p>Wpisz nazwę miejsca powyżej. Tu pojawią się ostatnio oglądane karty.</p>
          ) : (
            <ul className="search__recent">
              {recent.map((e) => (
                <li key={e.id} className="card">
                  <Link to={`/miejsce/${e.id}`}>{e.name}</Link>
                  {e.address && <span> · {e.address}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {fetch.status === 'loading' && <Loading lines={4} />}
      {fetch.status === 'error' && <ErrorState error={fetch.error} />}

      {fetch.status === 'ok' && (
        <>
          <p aria-hidden="true" className="search__count">{countText(fetch.count)}</p>
          {fetch.results.length === 0 ? (
            <Empty title="Nie znaleźliśmy tego miejsca">
              <ul>
                <li>Sprawdź pisownię.</li>
                <li>Spróbuj ogólniejszej frazy, np. „muzeum” zamiast nazwy.</li>
                <li>Wyczyść filtr kategorii.</li>
              </ul>
            </Empty>
          ) : (
            <div className={`search__split ${view === 'map' ? 'search__split--map' : ''}`}>
              <ul
                className="search__list"
                onMouseOver={(e) => {
                  const li = e.target.closest?.('li[data-place-id]')
                  setHighlightId(li ? Number(li.dataset.placeId) : null)
                }}
                onFocusCapture={(e) => {
                  const li = e.target.closest?.('li[data-place-id]')
                  if (li) setHighlightId(Number(li.dataset.placeId))
                }}
              >
                {fetch.results.slice(0, visible).map((r) => (
                  <ResultCard key={r.id} place={r} />
                ))}
              </ul>
              {fetch.results.length > visible && (
                <button type="button" className="btn btn--block" onClick={showMore}>Pokaż więcej ({fetch.results.length - visible})</button>
              )}
              <div className="search__map">
                <p className="notice notice--info">Na mapie: te same {Math.min(visible, fetch.results.length)} wyniki, co na liście.</p>
                <Suspense fallback={<Loading lines={2} />}>
                  <LazyMap
                    markers={markers}
                    highlightId={highlightId}
                    onMarkerClick={(id) => { setSelectedId(id); setHighlightId(id) }}
                    label="Mapa wyników wyszukiwania"
                  />
                </Suspense>
                {selected && (
                  <div className="search__sheet card">
                    <p><strong>{selected.name}</strong> · {selected.category_label}</p>
                    {selected.is_sample && <SampleBadge />}
                    <p>
                      {selected.summary
                        ? `${selected.summary.match} pasuje · ${selected.summary.barrier} bariery · ${selected.summary.unknown} brak danych`
                        : ''}
                      {formatDistance(selected.distance_m) && <> · {formatDistance(selected.distance_m)}</>}
                    </p>
                    <Link className="btn btn--primary" to={`/miejsce/${selected.id}`}>Szczegóły</Link>{' '}
                    <button type="button" className="btn" onClick={() => setSelectedId(null)}>Zamknij</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

