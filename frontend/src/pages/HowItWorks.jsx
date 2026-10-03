// OWNER: A4 - jak korzystać (spec B.7).
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './HowItWorks.css'

export default function HowItWorks() {
  useDocumentTitle('Jak to działa')
  return (
    <div className="container page content">
      <h1>Jak to działa</h1>
      <p className="lead">Trzy kroki do konkretów — bez znaczka „dostępne”.</p>
      <ol>
        <li><strong>Powiedz, co jest barierą</strong> na stronie <Link to="/moje-potrzeby">Moje potrzeby</Link> — np. próg do 2 cm, drzwi min. 80 cm. Nie pytamy o niepełnosprawność.</li>
        <li><strong>Wyszukaj miejsce</strong> albo <Link to="/trasa">zaplanuj trasę</Link>.</li>
        <li><strong>Czytaj parametry:</strong> co pasuje do Twojego profilu, co jest barierą, a czego po prostu nie wiemy.</li>
      </ol>
      <section aria-labelledby="czytanie">
        <h2 id="czytanie">Jak czytać kartę miejsca</h2>
        <ol>
          <li>Górne podsumowanie: liczby „pasuje · bariera · brak danych”.</li>
          <li>Najważniejsza uwaga — np. którym wejściem ominąć stopnie.</li>
          <li>Parametry w grupach; grupa z barierą jest rozwinięta.</li>
          <li>Przy parametrze: wartość, dopasowanie do Twojego wymogu, źródło z datą i statusem.</li>
          <li>„Inne źródła”: gdy jest ich więcej niż jedno.</li>
          <li>Sprzeczne dane pokazujemy obok siebie z przyciskiem „Byłem tam, potwierdzam”.</li>
        </ol>
      </section>
      <section aria-labelledby="nie">
        <h2 id="nie">Czego BezProgu nie robi</h2>
        <ul>
          <li>Nie wydaje werdyktu „dostępne” — decyzję podejmujesz Ty na podstawie konkretów.</li>
          <li>Nie gwarantuje stanu faktycznego — remonty i meble przestawiają się szybciej niż dane.</li>
          <li>Nie zgaduje przy braku danych — „brak danych” to pełnoprawna odpowiedź.</li>
        </ul>
      </section>
      <section aria-labelledby="film">
        <h2 id="film">Film (3 min)</h2>
        <p>Film z napisami i transkrypcją pojawi się po nagraniu wersji demonstracyjnej. Nie odtwarzamy go automatycznie.</p>
        <details><summary>Transkrypcja</summary><p>Transkrypcja pojawi się razem z filmem.</p></details>
      </section>
      <p><Link className="btn btn--primary" to="/szukaj">Sprawdź pierwsze miejsce</Link></p>
    </div>
  )
}
