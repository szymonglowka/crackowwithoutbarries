// OWNER: A4 - strona główna (spec B.1).
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useProfile } from '../hooks/useProfile.js'
import { useMeta } from '../hooks/useMeta.js'
import StatusIcon from '../components/StatusIcon.jsx'
import { MatchBadge, SampleBadge } from '../components/Badges.jsx'
import './Home.css'

export default function Home() {
  useDocumentTitle('Strona główna')
  const [profile, setProfile] = useProfile()
  const meta = useMeta()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const applyPreset = (key) => {
    const preset = meta?.profile_presets?.[key]
    const values = preset?.values ?? (key === 'stroller'
      ? { max_steps: 0, max_threshold_cm: 5, min_door_width_cm: 70, max_incline_pct: 8, needs_elevator: true, needs_accessible_toilet: false, needs_changing_table: true, needs_seating: false, avoid_cobblestone: false }
      : profile.values)
    setProfile({ preset: key, values: { ...values } })
  }

  const submit = (e) => {
    e.preventDefault()
    navigate(`/szukaj${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
  }

  return (
    <div className="container page home">
      <section className="home-hero" aria-labelledby="home-h1">
        <div>
          <h1 id="home-h1">Nie »dostępne«. Konkretnie.</h1>
          <p className="home-sub">
            BezProgu pokazuje konkretne bariery krakowskich miejsc i tras — stopnie, progi,
            szerokość drzwi, nawierzchnię — dopasowane do Twoich potrzeb.
          </p>
          <div className="home-profile-toggle" role="group" aria-label="Wybierz profil">
            <button
              type="button" className="btn" aria-pressed={profile.preset === 'wheelchair'}
              onClick={() => applyPreset('wheelchair')}
            >Wózek</button>
            <button
              type="button" className="btn" aria-pressed={profile.preset === 'stroller'}
              onClick={() => applyPreset('stroller')}
            >Wózek dziecięcy</button>
          </div>
          <form onSubmit={submit} className="home-search">
            <div className="field">
              <label htmlFor="home-q">Dokąd?</label>
              <input id="home-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Np. Sukiennice" />
            </div>
            <button type="submit" className="btn btn--primary btn--block">Sprawdź</button>
          </form>
          <p><Link to="/trasa">Albo zaplanuj trasę →</Link></p>
        </div>
        <div className="card home-mock" aria-label="Podgląd karty miejsca">
          <p className="home-mock-name">Sukiennice <SampleBadge /></p>
          <ul className="match-summary" aria-label="Dopasowanie do Twojego profilu">
            <li><MatchBadge match="match">4 pasuje</MatchBadge></li>
            <li><MatchBadge match="barrier">3 bariery</MatchBadge></li>
            <li><MatchBadge match="unknown">1 brak danych</MatchBadge></li>
          </ul>
          <p className="home-mock-fact">Wejście główne: 3 stopnie. <strong>Bariera</strong>, potwierdzone 09.2026.</p>
          <p><Link to="/miejsce/5">Zobacz kartę →</Link></p>
          <p>Dane przykładowe, profil: wózek.</p>
        </div>
      </section>

      <section aria-labelledby="home-examples-h">
        <h2 id="home-examples-h">Szybkie przykłady</h2>
        <ul className="home-pills">
          <li><Link className="btn" to="/szukaj?q=Sukiennice">Sukiennice <span className="home-pill-sample">przykład</span></Link></li>
          <li><Link className="btn" to="/trasa?from=Dworzec+Główny&to=Rynek+Główny">Dworzec → Rynek <span className="home-pill-sample">przykład</span></Link></li>
          <li><Link className="btn" to="/szukaj?q=Kino+Pod+Baranami">Kino Pod Baranami <span className="home-pill-sample">przykład</span></Link></li>
        </ul>
      </section>

      <section className="home-problem" aria-labelledby="home-problem-h">
        <h2 id="home-problem-h">Dlaczego konkretnie, a nie »dostępne«?</h2>
        <div className="home-problem-grid">
          <div className="card">
            <h3>Tak jest dziś</h3>
            <p className="home-today">„Obiekt dostępny ✓”</p>
            <p>Dla kogo? Z jakim wózkiem? Którym wejściem? Tego nie dowiesz się z jednego znaczka.</p>
          </div>
          <div className="card">
            <h3>Tak jest w BezProgu</h3>
            <ul>
              <li>Stopnie przy wejściu głównym: 3 — potwierdził właściciel</li>
              <li>Wejście boczne bez stopni — potwierdził właściciel</li>
              <li>Szerokość drzwi: 85 cm — potwierdził właściciel</li>
              <li>Przewijak: brak danych — nie zgadujemy</li>
            </ul>
          </div>
        </div>
        <p><Link to="/jak-to-dziala">Zobacz, jak to działa →</Link></p>
      </section>

      <section aria-labelledby="home-steps-h">
        <h2 id="home-steps-h">Trzy kroki</h2>
        <ol className="home-steps">
          <li>Powiedz, co jest dla Ciebie barierą — tylko na Twoim urządzeniu.</li>
          <li>Wyszukaj miejsce albo zaplanuj trasę.</li>
          <li>Sprawdź konkretne parametry: co pasuje, co jest barierą, czego nie wiemy.</li>
        </ol>
      </section>

      <section aria-labelledby="home-trust-h">
        <h2 id="home-trust-h">Wiemy, co wiemy — i mówimy, czego nie wiemy</h2>
        <ul className="home-legend">
          <li><StatusIcon status="confirmed" /> Potwierdzone</li>
          <li><StatusIcon status="open_data" /> Z otwartych danych</li>
          <li><StatusIcon status="user_report" /> Zgłoszenie użytkownika</li>
          <li><StatusIcon status="missing" /> Brak danych</li>
        </ul>
        <p>Przy każdej informacji widzisz, skąd jest i kiedy ktoś ją sprawdził. <Link to="/dane">Skąd bierzemy dane →</Link></p>
      </section>

      <section className="home-partners" aria-labelledby="home-partners-h">
        <h2 id="home-partners-h">Dla partnerów</h2>
        <div className="home-problem-grid">
          <div className="card">
            <h3>Prowadzisz hotel, muzeum lub wydarzenie?</h3>
            <p>Pokaż gościom konkretne parametry dostępności i zbieraj mniej telefonów z pytaniami.</p>
            <p><Link className="btn" to="/dla-firm">Dla firm →</Link></p>
          </div>
          <div className="card">
            <h3>Reprezentujesz miasto?</h3>
            <p>Kolejne miasto to konfiguracja, nie nowy projekt. Zobacz architekturę i plan rozwoju.</p>
            <p><Link className="btn" to="/dla-miast">Dla miast →</Link></p>
          </div>
        </div>
      </section>
    </div>
  )
}
