import { Link } from 'react-router-dom'

const SECTIONS = [
  { title: 'Produkt', links: [['/szukaj', 'Sprawdź miejsce'], ['/trasa', 'Zaplanuj trasę'], ['/jak-to-dziala', 'Jak to działa'], ['/faq', 'FAQ']] },
  { title: 'Dane', links: [['/dane', 'Skąd dane'], ['/licencje', 'Licencje']] },
  { title: 'Zasady', links: [['/prywatnosc', 'Prywatność'], ['/regulamin', 'Regulamin'], ['/dostepnosc', 'Deklaracja dostępności']] },
  { title: 'Kontakt', links: [['/dla-firm', 'Dla firm'], ['/dla-miast', 'Dla miast']] },
]

export default function Footer() {
  const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__sections">
          {SECTIONS.map((s) => (
            <details key={s.title} className="site-footer__section" open={isDesktop}>
              <summary>{s.title}</summary>
              <ul>{s.links.map(([to, label]) => <li key={to}><Link to={to}>{label}</Link></li>)}</ul>
            </details>
          ))}
        </div>
        <p>Dane mapy © <a href="https://www.openstreetmap.org/copyright">współtwórcy OpenStreetMap</a>, ODbL.</p>
        <p>Prototyp przygotowany na hackathon. Część danych to dane przykładowe. <Link to="/dostepnosc">Deklaracja dostępności</Link></p>
      </div>
    </footer>
  )
}
