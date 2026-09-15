import { Link } from 'react-router-dom'
import { DataBackupSection } from '../features/backup/components/DataBackupSection'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <h1>Settings</h1>
      <DataBackupSection />

      <div className={styles.section}>
        <h2 className={styles.sectionHeading}>Maintenance</h2>
        <Link to="/settings/maintenance-catalog" className={styles.menuRow}>
          <span>Maintenance Item Catalog</span>
          <span aria-hidden="true">›</span>
        </Link>
      </div>
    </div>
  )
}
