import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { MENU_INFO, MENU_MAIN } from './nav.js'

export default function Header() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const firstLinkRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    firstLinkRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab') {
        const items = Array.from(document.querySelectorAll('#site-menu a[href], #site-menu button'))
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  function close() {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="logo">
          <img src="/logo-horizontal.svg" alt="BezProgu" width="140" height="40" />
          <span className="visually-hidden">: strona główna</span>
        </Link>

        <nav className="desktop-nav" aria-label="Główna">
          {[...MENU_MAIN, ...MENU_INFO].map((item) => (
            <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
          ))}
          <Link to="/dla-firm" className="btn">Dla partnerów</Link>
        </nav>

        <button ref={buttonRef} type="button" className="btn menu-button"
          aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2.5" /></svg>
          Menu
        </button>
      </div>

      {open && (
        <div id="site-menu" className="menu-overlay" role="dialog" aria-modal="true" aria-label="Menu">
          <nav aria-label="Menu">
            <ul>
              {MENU_MAIN.map((item, i) => (
                <li key={item.to}><Link ref={i === 0 ? firstLinkRef : undefined} to={item.to}>{item.label}</Link></li>
              ))}
            </ul>
            <hr />
            <ul>
              {MENU_INFO.map((item) => <li key={item.to}><Link to={item.to}>{item.label}</Link></li>)}
            </ul>
          </nav>
          <button type="button" className="btn btn--block" onClick={close}>Zamknij</button>
        </div>
      )}
    </header>
  )
}
