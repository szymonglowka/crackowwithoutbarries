import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import BottomNav from './BottomNav.jsx'
import Footer from './Footer.jsx'
import PrototypeBanner from './PrototypeBanner.jsx'
import './layout.css'

/** `app` = app section (bottom nav on mobile). */
export default function Layout({ app = false }) {
  const mainRef = useRef(null)
  const { pathname } = useLocation()

  // On route change move focus to <main> so screen readers announce the new page.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <>
      <a className="skip-link" href="#main">Przejdź do treści</a>
      <PrototypeBanner />
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      {app && <BottomNav />}
    </>
  )
}
