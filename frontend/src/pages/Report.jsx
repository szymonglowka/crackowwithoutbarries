// OWNER: A4 - zgłoszenie poprawki w 3 krokach, bez konta.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useMeta } from '../hooks/useMeta.js'
import { getPlace, searchPlaces } from '../api/places.js'
import { createReport } from '../api/reports.js'
import { ErrorState, Loading } from '../components/PageStates.jsx'
import './Report.css'

const todayISO = () => new Date().toISOString().slice(0, 10)

const ERROR_IDS = {
  place: 'report-place-error',
  parameter: 'report-parameter-error',
  value: 'report-new-error',
  observed_at: 'report-date-error',
  email: 'report-email-error',
}

const FIELD_IDS = {
  place: 'report-place',
  parameter: 'report-parameters',
  value: 'report-new',
  observed_at: 'report-date',
  email: 'report-email',
}

function fieldError(body, field) {
  const msgs = body?.[field]
  if (!msgs) return null
  return <p className="report-field-error" id={ERROR_IDS[field]}>{Array.isArray(msgs) ? msgs.join(' ') : String(msgs)}</p>
}

const focusField = (e, id) => {
  e.preventDefault()
  document.getElementById(id)?.focus()
}


// Field names in DRF 400 responses -> Polish labels for the error summary
const FIELD_LABELS = {
  place: 'Miejsce', parameter: 'Parametr', value: 'Nowa wartość', comment: 'Opis',
  observed_at: 'Data obserwacji', email: 'E-mail',
}

export default function Report() {
  useDocumentTitle('Zgłoś zmianę')
  const [params] = useSearchParams()
  const meta = useMeta()
  const [step, setStep] = useState(1)
  const [placeId, setPlaceId] = useState(params.get('place') ?? '')
  const [place, setPlace] = useState(null)
  const [placeQuery, setPlaceQuery] = useState('')
  const [placeOptions, setPlaceOptions] = useState([])
  const [placeLoading, setPlaceLoading] = useState(false)
  const [paramKey, setParamKey] = useState(params.get('parameter') ?? '')
  const [currentValue, setCurrentValue] = useState('')
  const [newValue, setNewValue] = useState('')
  const [comment, setComment] = useState('')
  const [observedAt, setObservedAt] = useState(todayISO())
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState({})
  const [serverErrors, setServerErrors] = useState(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const summaryRef = useRef(null)
  const stepHeadingRef = useRef(null)

const STEP_TITLES = {
  1: 'Krok 1 z 3: miejsce i parametr',
  2: 'Krok 2 z 3: co się zmieniło',
  3: 'Krok 3 z 3: sprawdź i wyślij',
}

  // Load pre-selected place
  useEffect(() => {
    if (!placeId) return
    setPlaceLoading(true)
    getPlace(placeId)
      .then((p) => { setPlace(p); setLoadError(null) })
      .catch((e) => setLoadError(e))
      .finally(() => setPlaceLoading(false))
  }, [placeId])

  const parameters = useMemo(() => meta?.parameters ?? [], [meta])

  const paramDef = parameters.find((p) => p.key === paramKey)

  // Show current value of the chosen parameter, read-only
  useEffect(() => {
    if (!place || !paramDef) { setCurrentValue(''); return }
    const groups = place.groups ?? []
    for (const g of groups) {
      const p = (g.parameters ?? []).find((x) => x.key === paramKey)
      if (p) { setCurrentValue(p.value_display ?? 'brak danych'); return }
    }
    setCurrentValue('brak danych')
  }, [place, paramDef, paramKey])

  const searchTimer = useRef(null)
  const onQuery = (q) => {
    setPlaceQuery(q)
    clearTimeout(searchTimer.current)
    if (q.trim().length < 2) { setPlaceOptions([]); return }
    searchTimer.current = setTimeout(() => {
      searchPlaces({ q: q.trim() }).then((r) => setPlaceOptions(r.results ?? [])).catch(() => {})
    }, 300)
  }

  const focusSummary = () => setTimeout(() => summaryRef.current?.focus(), 0)
  // Server errors arrive after an await; focus the summary once it is rendered
  useEffect(() => {
    if (serverErrors) summaryRef.current?.focus()
  }, [serverErrors])

  const validateStep = () => {
    const e = {}
    if (step === 1) {
      if (!placeId) e.place = 'Wybierz miejsce.'
      if (!paramKey) e.parameter = 'Wybierz parametr.'
    }
    if (step === 2) {
      if (newValue === '' || newValue == null) e.value = 'Podaj nową wartość.'
      if (!observedAt) e.observed_at = 'Podaj datę obserwacji.'
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = 'Podaj poprawny e-mail albo zostaw puste.'
    }
    setErrors(e)
    if (Object.keys(e).length) focusSummary()
    return Object.keys(e).length === 0
  }

  const focusStepHeading = () => setTimeout(() => stepHeadingRef.current?.focus(), 0)
  const next = (e) => { e.preventDefault(); if (validateStep()) { setStep((s) => Math.min(3, s + 1)); setServerErrors(null); focusStepHeading() } }
  const back = () => { setStep((s) => Math.max(1, s - 1)); focusStepHeading() }

  const submit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return
    setSending(true)
    setServerErrors(null)
    try {
      const value = paramDef?.type === 'bool' ? (newValue === 'tak' ? true : newValue === 'nie' ? false : newValue) : (paramDef?.type === 'int' || paramDef?.type === 'number' ? Number(newValue) : newValue)
      await createReport({ place: Number(placeId), parameter: paramKey, value, comment, observed_at: observedAt, email, website: honeypot })
      setDone(true)
    } catch (err) {
      setServerErrors(err.status === 400 && err.body ? err.body : { detail: ['Nie udało się wysłać zgłoszenia. Spróbuj ponownie.'] })
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="container page report">
        <h1>Zgłoszenie wysłane</h1>
        <p aria-live="polite" className="notice notice--info">
          Zgłoszenie jest już widoczne na karcie jako »Zgłoszenie użytkownika«.
          Status zmieni się po potwierdzeniu przez inne osoby lub właściciela obiektu.
        </p>
        <p><Link className="btn btn--primary" to={`/miejsce/${placeId}`}>Wróć do miejsca</Link></p>
      </div>
    )
  }

  const serverList = serverErrors
    ? Object.entries(serverErrors).flatMap(([k, v]) =>
        (Array.isArray(v) ? v : [v]).map((m) => ({ key: k, text: FIELD_LABELS[k] ? `${FIELD_LABELS[k]}: ${m}` : String(m) })))
    : []

  return (
    <div className="container page report">
      <h1>Zgłoś zmianę lub błąd</h1>
      <h2 tabIndex={-1} ref={stepHeadingRef}>{STEP_TITLES[step]}</h2>

      {(Object.keys(errors).length > 0 || serverList.length > 0) && (
        <div className="notice notice--warning" ref={summaryRef} tabIndex={-1} role="alert">
          <strong>Popraw następujące pola:</strong>
          <ul>
            {Object.entries(errors).map(([k, v]) => (
              <li key={k}>
                {FIELD_IDS[k]
                  ? <a href={`#${FIELD_IDS[k]}`} onClick={(e) => focusField(e, FIELD_IDS[k])}>{v}</a>
                  : v}
              </li>
            ))}
            {serverList.map((m, i) => (
              <li key={i}>
                {FIELD_IDS[m.key]
                  ? <a href={`#${FIELD_IDS[m.key]}`} onClick={(e) => focusField(e, FIELD_IDS[m.key])}>{m.text}</a>
                  : m.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loadError && <ErrorState error={loadError}>Nie znaleziono miejsca. Wybierz je z listy poniżej.</ErrorState>}

      <form onSubmit={step === 3 ? submit : next} noValidate>
        <input
          type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
          className="visually-hidden" tabIndex={-1} autoComplete="off" aria-hidden="true"
        />

        {step === 1 && (
          <>
            <div className="field">
              <label htmlFor="report-place">Miejsce</label>
              {place ? (
                <p className="report-place-current">
                  {place.name} <button type="button" className="btn" onClick={() => { setPlace(null); setPlaceId('') }}>Zmień</button>
                </p>
              ) : (
                <>
                  <input
                    id="report-place" type="text" value={placeQuery} onChange={(e) => onQuery(e.target.value)}
                    placeholder="Wpisz nazwę miejsca" autoComplete="off" role="combobox" aria-expanded={placeOptions.length > 0} aria-controls="report-place-list"
                    aria-invalid={!!(errors.place || serverErrors?.place)} aria-describedby={(errors.place || serverErrors?.place) ? 'report-place-error' : undefined}
                  />
                  {placeOptions.length > 0 && (
                    <ul id="report-place-list" role="listbox" className="report-options">
                      {placeOptions.map((o) => (
                        <li key={o.id} role="option" aria-selected="false">
                          <button type="button" onClick={() => { setPlaceId(String(o.id)); setPlace(o); setPlaceOptions([]) }}>
                            {o.name} — {o.address}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {errors.place && <p className="report-field-error" id="report-place-error">{errors.place}</p>}
              {fieldError(serverErrors, 'place')}
            </div>

            <fieldset className="report-params" id="report-parameters" tabIndex={-1}
              aria-describedby={(errors.parameter || serverErrors?.parameter) ? 'report-parameter-error' : undefined}>
              <legend>Co chcesz zgłosić?</legend>
              {!meta && <Loading lines={3} />}
              {parameters.map((p) => (
                <label key={p.key} className="report-param">
                  <input type="radio" name="parameter" value={p.key} checked={paramKey === p.key} onChange={(e) => setParamKey(e.target.value)} />
                  <span>{p.label}</span>
                </label>
              ))}
              {errors.parameter && <p className="report-field-error" id="report-parameter-error">{errors.parameter}</p>}
              {fieldError(serverErrors, 'parameter')}
            </fieldset>
          </>
        )}

        {step === 2 && (
          <>
            <div className="field">
              <label htmlFor="report-current">Obecna wartość (odczyt)</label>
              <input id="report-current" type="text" value={placeLoading ? 'Wczytywanie…' : currentValue} readOnly />
            </div>
            <div className="field">
              <label htmlFor="report-new">Nowa wartość</label>
              {paramDef?.type === 'bool' ? (
                <select id="report-new" value={newValue} onChange={(e) => setNewValue(e.target.value)}
                  aria-invalid={!!(errors.value || serverErrors?.value)} aria-describedby={(errors.value || serverErrors?.value) ? 'report-new-error' : undefined}>
                  <option value="">— wybierz —</option>
                  <option value="tak">tak</option>
                  <option value="nie">nie</option>
                </select>
              ) : paramDef?.type === 'enum' && paramDef.choices ? (
                <select id="report-new" value={newValue} onChange={(e) => setNewValue(e.target.value)}
                  aria-invalid={!!(errors.value || serverErrors?.value)} aria-describedby={(errors.value || serverErrors?.value) ? 'report-new-error' : undefined}>
                  <option value="">— wybierz —</option>
                  {Object.entries(paramDef.choices).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              ) : (
                <input
                  id="report-new" type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)}
                  placeholder={paramDef?.unit ? `np. 2 (${paramDef.unit})` : 'np. 2'}
                  aria-invalid={!!(errors.value || serverErrors?.value)} aria-describedby={(errors.value || serverErrors?.value) ? 'report-new-error' : undefined}
                />
              )}
              {errors.value && <p className="report-field-error" id="report-new-error">{errors.value}</p>}
              {fieldError(serverErrors, 'value')}
            </div>
            <div className="field">
              <label htmlFor="report-comment">Opis (opcjonalnie)</label>
              <textarea id="report-comment" rows="3" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Np. próg przy wejściu bocznym, mierzone 3 października." />
            </div>
            <div className="field">
              <label htmlFor="report-photo">Zdjęcie (opcjonalnie)</label>
              <input id="report-photo" type="file" accept="image/*" disabled aria-describedby="report-photo-note" />
              <p id="report-photo-note" className="report-note">Wysyłanie zdjęć będzie dostępne wkrótce. Lokalizacja z metadanych zostanie usunięta.</p>
            </div>
            <div className="field">
              <label htmlFor="report-date">Data obserwacji</label>
              <input id="report-date" type="date" value={observedAt} max={todayISO()} onChange={(e) => setObservedAt(e.target.value)}
                aria-invalid={!!(errors.observed_at || serverErrors?.observed_at)} aria-describedby={(errors.observed_at || serverErrors?.observed_at) ? 'report-date-error' : undefined} />
              {errors.observed_at && <p className="report-field-error" id="report-date-error">{errors.observed_at}</p>}
              {fieldError(serverErrors, 'observed_at')}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <dl className="card report-summary">
              <dt>Miejsce</dt><dd>{place?.name ?? `#${placeId}`}</dd>
              <dt>Parametr</dt><dd>{paramDef?.label ?? paramKey}</dd>
              <dt>Obecna wartość</dt><dd>{currentValue || '—'}</dd>
              <dt>Nowa wartość</dt><dd>{String(newValue)}</dd>
              {comment && <><dt>Opis</dt><dd>{comment}</dd></>}
              <dt>Data obserwacji</dt><dd>{observedAt}</dd>
            </dl>
            <div className="field">
              <label htmlFor="report-email">E-mail do powiadomienia (opcjonalnie)</label>
              <input id="report-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="ty@przyklad.pl"
                aria-invalid={!!(errors.email || serverErrors?.email)} aria-describedby={(errors.email || serverErrors?.email) ? 'report-email-error' : undefined} />
              {errors.email && <p className="report-field-error" id="report-email-error">{errors.email}</p>}
              {fieldError(serverErrors, 'email')}
            </div>
          </>
        )}

        <div className="report-nav">
          {step > 1 && <button type="button" className="btn" onClick={back}>Wstecz</button>}
          {step < 3
            ? <button type="submit" className="btn btn--primary">Dalej</button>
            : <button type="submit" className="btn btn--primary" disabled={sending}>{sending ? 'Wysyłanie…' : 'Wyślij'}</button>}
        </div>
      </form>
    </div>
  )
}
