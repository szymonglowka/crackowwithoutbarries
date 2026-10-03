// OWNER: A4 - polityka prywatności (spec B.12).
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import './Privacy.css'

export default function Privacy() {
  useDocumentTitle('Polityka prywatności')
  return (
    <div className="container page content">
      <h1>Polityka prywatności</h1>
      <section className="card" aria-labelledby="prosto">
        <h2 id="prosto">Wprost, w 5 zdaniach</h2>
        <ol>
          <li>Twój profil potrzeb jest zapisany tylko na Twoim urządzeniu (localStorage) — nie wysyłamy go nigdzie poza anonimowymi parametrami wyszukiwania.</li>
          <li>Nigdy nie pytamy o niepełnosprawność — tylko o bariery, np. maks. wysokość progu.</li>
          <li>Zgłoszenia nie wymagają konta; e-mail jest opcjonalny i służy tylko do powiadomienia o statusie.</li>
          <li>Przy zgłoszeniach nie zapisujemy adresu IP wprost — co najwyżej jego skrót do ochrony przed spamem.</li>
          <li>Usunięcie danych: wyczyść dane strony w przeglądarce (profil) albo napisz do nas w sprawie zgłoszenia.</li>
        </ol>
      </section>
      <section aria-labelledby="pelna">
        <h2 id="pelna">Pełna treść</h2>
        <h3>Administrator</h3><p>Prototyp hackathonowy; docelowo operator wskazany na stronie /dla-miast. Kontakt: kontakt@bezprogu.pl.</p>
        <h3>Co zbieramy</h3><p>Treść zgłoszeń (parametr, wartość, opis, data obserwacji) i opcjonalny e-mail. Logi serwera (anonimizowane) do bezpieczeństwa. Połączenie szyfrowane HTTPS.</p>
        <h3>Czego nie zbieramy</h3><p>Danych o zdrowiu i niepełnosprawności, kont użytkowników, lokalizacji (chyba że sam klikniesz „Użyj mojej lokalizacji” — wtedy używamy jej tylko do sortowania wyników).</p>
        <h3>Pliki cookie i przechowywanie lokalne</h3><p>Tylko techniczne: profil w localStorage. Brak reklam i trackerów.</p>
        <h3>Twoje prawa</h3><p>Dostęp, poprawienie i usunięcie swoich zgłoszeń — napisz do nas, podając datę i treść zgłoszenia.</p>
      </section>
    </div>
  )
}
