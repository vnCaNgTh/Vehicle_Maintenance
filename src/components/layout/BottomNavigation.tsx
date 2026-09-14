import { NavLink } from 'react-router-dom'
import styles from './BottomNavigation.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/vehicles', label: 'Vehicles', end: false },
  { to: '/settings', label: 'Settings', end: false },
]

export function BottomNavigation() {
  return (
    <nav className={styles.nav} aria-label="Primary">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
