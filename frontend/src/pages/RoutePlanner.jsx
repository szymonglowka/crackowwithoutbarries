// OWNER: A2 - accessible pedestrian route planner (GraphHopper + OSM kerbs).
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getRoute } from '../api/route.js'
import { api, ApiError } from '../api/client.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useProfile } from '../hooks/useProfile.js'
import ProfileChip from '../components/ProfileChip.jsx'
import { Loading } from '../components/PageStates.jsx'
import PlaceSearch from '../components/route/PlaceSearch.jsx'
import RouteResult from '../components/route/RouteResult.jsx'
import './RoutePlanner.css'

const AVOID_OPTIONS = [
  { key: 'cobblestone', label: 'kostka brukowa', hint: 'zmienia przebieg trasy' },
  { key: 'high_kerbs', label: 'wysokie krawężniki', hint: 'na razie tylko oznaczamy je w opisie trasy' },
  { key: 'steep', label: 'strome podjazdy', hint: 'brak danych o nachyleniu — jeszcze nie uwzględniamy' },
  { key: 'no_data', label: 'odcinki bez danych', hint: 'na razie tylko oznaczamy je w opisie trasy' },
]

function parsePoint(raw) {
  if (!raw) return null
  const [lat, lon] = raw.split(',').map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { label: `Punkt na mapie (${lat.toFixed(4)}, ${lon.toFixed(4)})`, lat, lon }
}

export default function RoutePlanner() {
  useDocumentTitle('Zaplanuj trasę')
  const [profile] = useProfile()
  const [params] = useSearchParams()
  const [fromText, setFromText] = useState('')
  const [toText, setToText] = useState('')
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [avoid, setAvoid] = useState([])
  const [state, setState] = useState('idle') // idle|loading|done|e404|e503|error|offline
  const [routes, setRoutes] = useState([])
  const [activeId, setActiveId] = useState('main')
  const [geoError, setGeoError] = useState('')
  const [formError, setFormError] = useState('')
  const errorRef = useRef(null)

  const fetchRoute = useCallback(async (a, b, av) => {
    setState('loading')
    setRoutes([])
    try {
      const data = await getRoute({
        from: [a.lat, a.lon],
        to: [b.lat, b.lon],
        profile: profile.values,
        avoid: av,
      })
      setRoutes(data.routes ?? [])
      setActiveId('main')
      setState('done')
    } catch (e) {
      if (!navigator.onLine) setState('offline')
      else if (e instanceof ApiError && e.status === 404) setState('e404')
      else if (e instanceof ApiError && e.status === 503) setState('e503')
      else setState('error')
    }
  }, [profile.values])

  // Deep links: /trasa?from=lat,lon&to=lat,lon and ?toPlace=<id>.
  useEffect(() => {
    const f = parsePoint(params.get('from'))
    const t = parsePoint(params.get('to'))
    if (f) {
      setFrom(f)
      setFromText(f.label)
    }
    const toPlace = params.get('toPlace')
    if (toPlace) {
      api(`/places/${toPlace}/`)
        .then((p) => {
          setTo({ label: p.name, lat: p.lat, lon: p.lon })
          setToText(p.name)
        })
        .catch(() => {})
    } else if (t) {
      setTo(t)
      setToText(t.label)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (from && to && state === 'idle') fetchRoute(from, to, avoid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  useEffect(() => {
    if (['e404', 'e503', 'error', 'offline'].includes(state)) errorRef.current?.focus()
  }, [state])

  const pick = (which, r) => {
    const pt = { label: r.label, lat: r.lat, lon: r.lon }
    if (which === 'from') {
      setFrom(pt)
      setFromText(r.label)
    } else {
      setTo(pt)
      setToText(r.label)
    }
  }

  const swap = () => {
    setFrom(to)
    setTo(from)
    setFromText(toText)
    setToText(fromText)
  }

  const locate = () => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('Twoja przeglądarka nie udostępnia lokalizacji.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pt = { label: 'Moja lokalizacja', lat: pos.coords.latitude, lon: pos.coords.longitude }
        setFrom(pt)
        setFromText(pt.label)
      },
      () => setGeoError('Nie udało się pobrać lokalizacji. Wpisz punkt początkowy ręcznie.'),
      { timeout: 10000 },
    )
  }

  const submit = (e) => {
    e.preventDefault()
    if (!from || !to) {
      setFormError('Wybierz punkt początkowy i docelowy z listy wyników.')
      return
    }
    setFormError('')
    fetchRoute(from, to, avoid)
  }

  const submitAgain = () => {
    if (from && to) fetchRoute(from, to, avoid)
  }

  const toggleAvoid = (key) =>
    setAvoid((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  return (
    <div className="container page route-page">
      <h1>Zaplanuj trasę</h1>
      <ProfileChip />
      <div className="route-layout">
        <div className="route-form-col">
          <form onSubmit={submit} className="route-form">
            {formError && (
              <p className="notice notice--warning" role="alert">{formError}</p>
            )}
            <PlaceSearch id="skad" label="Skąd" text={fromText} selected={from} onText={(v) => { setFromText(v); setFrom(null) }} onPick={(r) => pick('from', r)} />
            <div className="route-form__row">
              <button type="button" className="btn" onClick={locate}>
                Moja lokalizacja
              </button>
              <button type="button" className="btn" onClick={swap} disabled={!from && !to} aria-label="Zamień początek z końcem">
                Zamień
              </button>
            </div>
            {geoError && <p className="notice notice--warning" role="alert">{geoError}</p>}
            <PlaceSearch id="dokad" label="Dokąd" text={toText} selected={to} onText={(v) => { setToText(v); setTo(null) }} onPick={(r) => pick('to', r)} />

            <details className="route-avoid">
              <summary>Unikaj (schody omijamy zawsze)</summary>
              {AVOID_OPTIONS.map((o) => (
                <label key={o.key} className="route-avoid__option">
                  <input
                    type="checkbox"
                    checked={avoid.includes(o.key)}
                    onChange={() => toggleAvoid(o.key)}
                    aria-describedby={`avoid-hint-${o.key}`}
                  />
                  {o.label}
                  <span className="route-avoid__hint" id={`avoid-hint-${o.key}`}>{o.hint}</span>
                </label>
              ))}
            </details>

            <button type="submit" className="btn btn--primary route-form__submit" disabled={state === 'loading'}>
              {state === 'loading' ? 'Wyznaczanie…' : 'Wyznacz trasę'}
            </button>
          </form>

          <div aria-live="polite">
            {state === 'loading' && <Loading />}
            {state === 'e404' && (
              <div className="notice notice--info" ref={errorRef} tabIndex={-1} role="alert">
                <strong>Nie znaleźliśmy trasy bez schodów między tymi punktami.</strong>
                <p>Spróbuj wybrać bliższe punkty albo sprawdź połączenie innym środkiem transportu.</p>
              </div>
            )}
            {state === 'e503' && (
              <div className="notice notice--warning" ref={errorRef} tabIndex={-1} role="alert">
                <strong>Usługa wyznaczania tras jest chwilowo niedostępna.</strong>
                <p>Spróbuj ponownie za chwilę albo zadzwoń do miejsca docelowego i zapytaj o dojście bez schodów.</p>
                <p>Przy pierwszym uruchomieniu serwis tras przygotowuje mapę (kilka minut).</p>
                <button type="button" className="btn" onClick={submitAgain}>Spróbuj ponownie</button>
              </div>
            )}
            {state === 'offline' && (
              <div className="notice notice--warning" ref={errorRef} tabIndex={-1} role="alert">
                <strong>Brak połączenia z internetem.</strong>
                <p>Trasy wyznaczamy online. Spróbuj ponownie, gdy wróci połączenie.</p>
              </div>
            )}
            {state === 'error' && (
              <div className="notice notice--warning" ref={errorRef} tabIndex={-1} role="alert">
                <strong>Nie udało się wyznaczyć trasy.</strong>
                <p>Spróbuj ponownie za chwilę.</p>
              </div>
            )}
          </div>

          {state === 'done' && routes.length > 0 && (
            <Suspense fallback={<Loading />}>
              <RouteResult routes={routes} activeId={activeId} onSelect={setActiveId} />
            </Suspense>
          )}
          {state === 'done' && routes.length === 0 && (
            <p className="notice notice--info">Nie znaleźliśmy trasy bez schodów między tymi punktami.</p>
          )}
        </div>
      </div>
    </div>
  )
}
