import { NavLink } from 'react-router-dom'
import { APP_NAV } from './nav.js'

/** Mobile-only app navigation. NavLink sets aria-current="page" on the active tab. */
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Aplikacja">
      <ul>
        {APP_NAV.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to}>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d={item.icon} fill="currentColor" /></svg>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
