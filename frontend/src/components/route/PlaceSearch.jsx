// OWNER: A2. Accessible place/address input: text field + results list of buttons.
import { useEffect, useRef, useState } from 'react'
import { geocode } from '../../api/route.js'
import './PlaceSearch.css'

export default function PlaceSearch({ id, label, text, onText, onPick }) {
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (text.trim().length < 2) {
      setResults([])
      setOpen(false)
      return undefined
    }
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        setResults((await geocode(text.trim())).slice(0, 6))
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer.current)
  }, [text])

  return (
    <div className="place-search">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder="np. Dworzec Główny"
        value={text}
        onChange={(e) => onText(e.target.value)}
        aria-expanded={open}
        aria-controls={`${id}-wyniki`}
        role="combobox"
        aria-autocomplete="list"
      />
      <p className="place-search__status" aria-live="polite">
        {searching
          ? 'Szukanie…'
          : open
            ? `Znaleziono ${results.length} ${results.length === 1 ? 'wynik' : results.length >= 2 && results.length <= 4 ? 'wyniki' : 'wyników'}.`
            : ''}
      </p>
      {open && results.length > 0 && (
        <ul id={`${id}-wyniki`} className="place-search__results" role="listbox" aria-label={`Wyniki dla „${label}”`}>
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lon},${i}`} role="option" aria-selected="false">
              <button
                type="button"
                onClick={() => {
                  onPick(r)
                  setOpen(false)
                }}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
