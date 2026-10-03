import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFound() {
  useDocumentTitle('Nie znaleziono strony')
  return (
    <div className="container page">
      <h1>Nie znaleźliśmy tej strony</h1>
      <p><Link to="/szukaj">Wyszukaj miejsce</Link> albo wróć na <Link to="/">stronę główną</Link>.</p>
    </div>
  )
}
