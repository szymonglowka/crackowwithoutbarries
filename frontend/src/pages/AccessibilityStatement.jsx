// OWNER: A4 - deklaracja dostępności (spec B.12).
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './AccessibilityStatement.css'

export default function AccessibilityStatement() {
  useDocumentTitle('Deklaracja dostępności')
  return (
    <div className="container page content">
      <h1>Deklaracja dostępności</h1>
      <p className="lead">Celem jest zgodność z WCAG 2.2 na poziomie AA. Prototyp hackathonowy spełnia część wymagań — poniżej stan na październik 2026.</p>
      <section aria-labelledby="dziala">
        <h2 id="dziala">Co działa</h2>
        <ul>
          <li>Pełna obsługa klawiaturą: nawigacja, formularze, akordeony (natywne detale), przełączniki z aria-pressed.</li>
          <li>Widoczny fokus, cele dotykowe min. 48×48 px, etykiety nad polami.</li>
          <li>Statusy oznaczone kształtem ikony i słowem — nigdy samym kolorem.</li>
          <li>Liczniki wyników i potwierdzenia formularzy w aria-live; podsumowanie błędów z fokusem.</li>
          <li>Każda mapa ma obok tekstowy odpowiednik tych samych informacji.</li>
        </ul>
      </section>
      <section aria-labelledby="prace">
        <h2 id="prace">Co wymaga dalszych prac</h2>
        <ul>
          <li>Brak testów z czytnikami VoiceOver i TalkBack.</li>
          <li>Niepełna obsługa mapy samą klawiaturą (lista tekstowa jest pełnym zamiennikiem).</li>
          <li>Brak wersji w języku łatwym do czytania (ETR).</li>
        </ul>
        <p>Data ostatniego przeglądu: październik 2026. Problemy zgłaszaj na <a href="mailto:kontakt@bezprogu.pl">kontakt@bezprogu.pl</a>.</p>
      </section>
    </div>
  )
}
