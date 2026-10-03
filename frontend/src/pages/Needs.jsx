// OWNER: A4 - profil potrzeb użytkownika (localStorage, bez pytania o niepełnosprawność).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useMeta } from '../hooks/useMeta.js'
import { DEFAULT_PROFILE, useProfile } from '../hooks/useProfile.js'
import { getPlace } from '../api/places.js'
import { Loading } from '../components/PageStates.jsx'
import { MatchSummary, plural } from '../components/Badges.jsx'
import './Needs.css'

const STROLLER_FALLBACK = {
  label: 'Wózek dziecięcy',
  values: {
    max_steps: 0, max_threshold_cm: 5, min_door_width_cm: 70, max_incline_pct: 8,
    needs_elevator: true, needs_accessible_toilet: false, needs_changing_table: true,
    needs_seating: false, avoid_cobblestone: false,
  },
}

const GROUP_ORDER = [
  { key: 'entrance', label: 'Wejście', fields: ['max_steps', 'max_threshold_cm', 'min_door_width_cm'] },
  { key: 'surface', label: 'Nawierzchnia', fields: ['max_incline_pct', 'avoid_cobblestone'] },
  { key: 'interior', label: 'Wnętrze', fields: ['needs_elevator', 'needs_accessible_toilet', 'needs_changing_table'] },
  { key: 'rest', label: 'Odpoczynek', fields: ['needs_seating'] },
]

const HINTS = {
  max_steps: 'Ile stopni dasz radę pokonać przy wejściu. 0 oznacza: tylko wejścia bez stopni.',
  max_threshold_cm: 'Próg to np. listwa w drzwiach albo krawędź windy. 2 cm to mniej więcej grubość dwóch monet.',
  min_door_width_cm: 'Mierzona w najwęższym miejscu, z otwartymi drzwiami. Standardowe drzwi wewnętrzne mają ok. 80 cm.',
  max_incline_pct: '6% nachylenia to 6 cm w górę na każdy metr. Pochylnia 1:12 to ok. 8%.',
  needs_elevator: 'Zaznacz, jeśli na wyższe piętra dostaniesz się tylko windą.',
  needs_accessible_toilet: 'Toaleta z miejscem na manewr i poręczami.',
  needs_changing_table: 'Przewijak albo stabilna, czysta powierzchnia w toalecie.',
  needs_seating: 'Zaznacz, jeśli potrzebujesz ławki lub miejsca do przysiądnięcia po drodze.',
  avoid_cobblestone: 'Kostka brukowa i kocie łby trzęsą wózkiem. Zaznacz, jeśli chcesz je omijać.',
}

const FIELD_LABELS = {
  max_steps: 'Maksymalna liczba stopni', max_threshold_cm: 'Maksymalna wysokość progu',
  min_door_width_cm: 'Minimalna szerokość drzwi', max_incline_pct: 'Maksymalne nachylenie',
  needs_elevator: 'Potrzebuję windy', needs_accessible_toilet: 'Potrzebuję dostosowanej toalety',
  needs_changing_table: 'Potrzebuję przewijaka', needs_seating: 'Potrzebuję miejsc do odpoczynku',
  avoid_cobblestone: 'Unikam kostki brukowej',
}

const FIELD_UNITS = { max_steps: 'szt.', max_threshold_cm: 'cm', min_door_width_cm: 'cm', max_incline_pct: '%' }
const FIELD_STEPS = { max_steps: 1, max_threshold_cm: 1, min_door_width_cm: 5, max_incline_pct: 1 }

function NumberField({ field, value, onChange }) {
  const dec = () => onChange(Math.max(0, (Number(value) || 0) - FIELD_STEPS[field]))
  const inc = () => onChange((Number(value) || 0) + FIELD_STEPS[field])
  return (
    <div className="needs-stepper">
      <button type="button" className="btn" onClick={dec} aria-label={`Zmniejsz: ${FIELD_LABELS[field]}`}>−</button>
      <input
        type="number" id={`needs-${field}`} min="0"
        step={FIELD_STEPS[field]} value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
      <button type="button" className="btn" onClick={inc} aria-label={`Zwiększ: ${FIELD_LABELS[field]}`}>+</button>
      {FIELD_UNITS[field] && <span className="needs-unit" aria-hidden="true">{FIELD_UNITS[field]}</span>}
    </div>
  )
}

export default function Needs() {
  useDocumentTitle('Moje potrzeby')
  const [profile, setProfile] = useProfile()
  const meta = useMeta()
  const [draft, setDraft] = useState(profile.values)
  const [saved, setSaved] = useState(false)
  const confirmRef = useRef(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => { setDraft(profile.values) }, [profile.values])

  useEffect(() => {
    const t = setTimeout(() => {
      getPlace(5, draft).then(setPreview).catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [draft])

  const presets = useMemo(() => {
    const fromMeta = meta?.profile_presets
    return [
      { key: 'wheelchair', ...(fromMeta?.wheelchair ?? { label: 'Wózek inwalidzki', values: DEFAULT_PROFILE.values }) },
      { key: 'stroller', ...(fromMeta?.stroller ?? STROLLER_FALLBACK) },
      { key: 'custom', label: 'Własne ustawienia', values: profile.preset === 'custom' ? profile.values : draft },
    ]
  }, [meta, profile.preset, profile.values, draft])

  const pickPreset = (key) => {
    const p = presets.find((x) => x.key === key)
    if (p && key !== 'custom') setDraft({ ...p.values })
    setSaved(false)
  }

  const setField = (key, v) => setDraft((d) => ({ ...d, [key]: v }))

  const save = (e) => {
    e.preventDefault()
    const activeKey = presets.find((p) => p.key !== 'custom' && JSON.stringify(p.values) === JSON.stringify(draft))?.key ?? 'custom'
    setProfile({ preset: activeKey, values: draft })
    setSaved(true)
    confirmRef.current?.focus?.()
  }

  const selectedPreset =
    presets.find((p) => p.key !== 'custom' && JSON.stringify(p.values) === JSON.stringify(draft))?.key ?? 'custom'
  const metaFields = meta?.profile_fields?.length ? meta.profile_fields : Object.keys(FIELD_LABELS).map((key) => ({ key, label: FIELD_LABELS[key], type: typeof draft[key] === 'boolean' ? 'bool' : 'number' }))
  const byKey = Object.fromEntries(metaFields.map((f) => [f.key, f]))

  return (
    <div className="container page needs">
      <h1>Moje potrzeby</h1>
      <p className="needs-intro">
        Powiedz nam, co jest dla Ciebie barierą. Nie pytamy o niepełnosprawność.
        Ustawienia zostają tylko na tym urządzeniu.
      </p>

      <div className="needs-layout">
        <form onSubmit={save}>
          <fieldset className="needs-presets" onChange={(e) => pickPreset(e.target.value)}>
            <legend>Wybierz profil</legend>
            {presets.map((p) => (
              <label key={p.key} className="needs-preset-card">
                <input
                  type="radio" name="preset" value={p.key}
                  checked={selectedPreset === p.key} onChange={() => {}}
                />
                <span className="needs-preset-label">{p.label}</span>
              </label>
            ))}
          </fieldset>

          <div className="needs-groups">
            {!meta && <Loading lines={4} />}
            {GROUP_ORDER.map((group) => (
              <section key={group.key} className="card needs-group" aria-labelledby={`needs-h-${group.key}`}>
                <h2 id={`needs-h-${group.key}`}>{group.label}</h2>
                {group.fields.map((key) => {
                  const f = byKey[key]
                  if (!f) return null
                  const label = f.label ?? FIELD_LABELS[key]
                  if (f.type === 'bool') {
                    return (
                      <div key={key} className="field needs-bool">
                        <label>
                          <input
                            type="checkbox" role="switch" aria-checked={!!draft[key]}
                            checked={!!draft[key]} onChange={(e) => setField(key, e.target.checked)}
                          />
                          {label}
                        </label>
                        <details><summary>Co to znaczy?</summary><p>{HINTS[key]}</p></details>
                      </div>
                    )
                  }
                  return (
                    <div key={key} className="field">
                      <label htmlFor={`needs-${key}`}>{label}</label>
                      <NumberField field={key} value={draft[key]} onChange={(v) => setField(key, v)} />
                      <details><summary>Co to znaczy?</summary><p>{HINTS[key]}</p></details>
                    </div>
                  )
                })}
              </section>
            ))}
          </div>

          <div className="needs-sticky">
            <button type="submit" className="btn btn--primary btn--block">Zapisz ustawienia</button>
          </div>
          <p aria-live="polite" className="needs-confirm" tabIndex={-1} ref={confirmRef}>
            {saved ? 'Zapisano. Ustawienia działają już przy wyszukiwaniu miejsc i tras.' : ''}
          </p>
        </form>

        <aside className="needs-preview" aria-labelledby="needs-preview-h">
          <h2 id="needs-preview-h">Podgląd z Twoimi ustawieniami</h2>
          <p><strong>Sukiennice (przykład)</strong></p>
          {preview?.summary && <MatchSummary summary={preview.summary} />}
          <p><Link to="/miejsce/5">Zobacz pełną kartę</Link></p>
          <p aria-live="polite">
            {preview?.summary
              ? `Podgląd zaktualizowany: ${preview.summary.match} pasuje, ${preview.summary.barrier} ${plural(preview.summary.barrier, 'bariera', 'bariery', 'barier')}, ${preview.summary.unknown} brak danych.`
              : 'Wczytywanie podglądu…'}
          </p>
        </aside>
      </div>

      <section className="card" aria-labelledby="needs-sync-h">
        <h2 id="needs-sync-h">Synchronizacja między urządzeniami (opcjonalnie)</h2>
        <p>
          Synchronizacja wymaga konta i nie jest jeszcze dostępna w prototypie.
          Twoje ustawienia są teraz zapisane tylko w tej przeglądarce.
          Szczegóły znajdziesz w <a href="/prywatnosc">polityce prywatności</a>.
        </p>
      </section>
    </div>
  )
}
