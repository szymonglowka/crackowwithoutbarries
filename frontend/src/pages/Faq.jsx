// OWNER: A4 - najczęstsze pytania.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './Faq.css'

const SECTIONS = [
  { name: 'Dla użytkowników', items: [
    ['Czy BezProgu powie mi, czy miejsce jest dostępne?', 'Nie — i celowo. Pokazujemy konkretne parametry (stopnie, progi, szerokość drzwi) dopasowane do Twojego profilu: Pasuje, Bariera albo Brak danych. Decyzję podejmujesz Ty.'],
    ['Czy muszę zakładać konto?', 'Nie. Profil potrzeb jest zapisany tylko w Twojej przeglądarce, a zgłoszenie poprawki nie wymaga konta.'],
    ['Co znaczy „Brak danych”?', 'Tyle, że tego nie wiemy — i nie zgadujemy. Traktuj to jako zachętę do telefonu przed wizytą albo do zgłoszenia po wizycie.'],
  ]},
  { name: 'Dane i wiarygodność', items: [
    ['Skąd macie dane?', 'Z OpenStreetMap, otwartych danych Krakowa, potwierdzeń właścicieli i zgłoszeń użytkowników. Każda informacja ma źródło, datę i status. Więcej: /dane.'],
    ['Zgłosiłem poprawkę — kiedy będzie widoczna?', 'Od razu, jako „Zgłoszenie użytkownika”. Status zmieni się po potwierdzeniu przez inne osoby lub właściciela.'],
    ['Dane się nie zgadzają. Co robić?', 'Na karcie miejsca zobaczysz obie wersje i przycisk „Byłem tam, potwierdzam”. Możesz też wysłać własne zgłoszenie.'],
  ]},
  { name: 'Prywatność', items: [
    ['Czy zbieracie dane o niepełnosprawności?', 'Nie. Pytamy tylko o bariery (np. maks. próg), a profil zostaje na Twoim urządzeniu.'],
    ['Co zapisujecie przy zgłoszeniu?', 'Treść zgłoszenia i opcjonalny e-mail. Nie zapisujemy adresu IP wprost. Szczegóły: /prywatnosc.'],
  ]},
  { name: 'Dla właścicieli obiektów', items: [
    ['Jak potwierdzić dane mojego obiektu?', 'Załóż profil obiektu — szczegóły w /dla-firm. Potwierdzenie podnosi status informacji do „Potwierdzone”.'],
    ['Czy płatny plan poprawia moją pozycję?', 'Nie. Płatność nigdy nie podnosi statusu wiarygodności ani pozycji w wynikach.'],
  ]},
  { name: 'Dla miast', items: [
    ['Czy miasto musi utrzymywać bazę?', 'Nie. Importujemy otwarte źródła automatycznie; miasto dostaje raport luk w danych. Więcej: /dla-miast.'],
    ['Ile kosztuje uruchomienie w kolejnym mieście?', 'To konfiguracja istniejących importerów, nie nowy projekt — wycena indywidualna per miasto.'],
  ]},
]

export default function Faq() {
  useDocumentTitle('FAQ')
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  return (
    <div className="container page content">
      <h1>Częste pytania</h1>
      <div className="field">
        <label htmlFor="faq-q">Szukaj w pytaniach</label>
        <input id="faq-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Np. konto, dane, miasto" />
      </div>
      {SECTIONS.map((s) => {
        const items = s.items.filter(([t, b]) => !needle || (t + b).toLowerCase().includes(needle))
        if (!items.length) return null
        return (
          <section key={s.name} aria-label={s.name}>
            <h2>{s.name}</h2>
            {items.map(([t, b]) => (
              <details key={t} className="card faq-item">
                <summary>{t}</summary>
                <p>{b}</p>
              </details>
            ))}
          </section>
        )
      })}
      <p>Nie znalazłeś odpowiedzi? Napisz do nas: <a href="mailto:kontakt@bezprogu.pl">kontakt@bezprogu.pl</a>. Zobacz też: <Link to="/jak-to-dziala">jak to działa</Link>.</p>
    </div>
  )
}
