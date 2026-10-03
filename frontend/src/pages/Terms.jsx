// OWNER: A4 - regulamin (spec B.12).
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './Terms.css'

export default function Terms() {
  useDocumentTitle('Regulamin')
  return (
    <div className="container page content">
      <h1>Regulamin</h1>
      <section aria-labelledby="zglaszanie"><h2 id="zglaszanie">Zasady zgłaszania</h2>
        <ul><li>Zgłaszaj tylko to, co sam zaobserwowałeś, z prawdziwą datą obserwacji.</li><li>Bez danych osobowych osób trzecich i bez zdjęć twarzy.</li><li>Jedno zgłoszenie = jeden parametr; do kolejnego użyj formularza ponownie.</li></ul>
      </section>
      <section aria-labelledby="moderacja"><h2 id="moderacja">Moderacja</h2>
        <p>Zgłoszenia widać od razu jako niezweryfikowane. Usuwamy spam, wulgaryzmy i dane osobowe. Status „Zgłoszenie użytkownika” zmienia się po potwierdzeniu przez inne osoby lub właściciela. Historia zmian jest publiczna na <Link to="/szukaj">kartach miejsc</Link>.</p>
      </section>
      <section aria-labelledby="api"><h2 id="api">Korzystanie z API</h2>
        <p>Dane otwarte na warunkach licencji ze strony <Link to="/licencje">/licencje</Link> (m.in. ODbL dla OSM — z atrybucją). Bez agresywnego odpytywania: cachuj odpowiedzi, maks. 1 zapytanie na sekundę do punktów geokodujących.</p>
      </section>
      <section aria-labelledby="odp"><h2 id="odp">Odpowiedzialność</h2>
        <p>Informacje mają charakter poglądowy; przed wizytą przy sprzecznych lub starych danych zadzwoń do obiektu. Nie wydajemy werdyktów „dostępne”.</p>
      </section>
    </div>
  )
}
