import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFound() {
  useDocumentTitle('Nie znaleziono strony')
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const search = (e) => {
    e.preventDefault()
    navigate(`/szukaj${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
  }

  return (
    <div className="container page">
      <h1>Nie znaleźliśmy tej strony</h1>
      <p><Link to="/szukaj">Wyszukaj miejsce</Link> albo wróć na <Link to="/">stronę główną</Link>.</p>
      <form role="search" onSubmit={search}>
        <div className="field">
          <label htmlFor="nf-q">Szukaj miejsca</label>
          <input id="nf-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button type="submit" className="btn btn--primary">Szukaj</button>
      </form>
    </div>
  )
}
