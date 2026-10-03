import { useState } from 'react'

const KEY = 'bezprogu.bannerClosed'

export default function PrototypeBanner() {
  const [closed, setClosed] = useState(() => localStorage.getItem(KEY) === '1')
  if (closed) return null
  return (
    <aside className="prototype-banner" aria-label="Informacja o prototypie">
      <div className="container prototype-banner__inner">
        <p>Prototyp: część danych to dane przykładowe.</p>
        <button type="button" className="btn" onClick={() => { localStorage.setItem(KEY, '1'); setClosed(true) }}>
          Zwiń<span className="visually-hidden"> informację o prototypie</span>
        </button>
      </div>
    </aside>
  )
}
