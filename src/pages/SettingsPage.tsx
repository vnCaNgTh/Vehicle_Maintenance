import styles from './SettingsPage.module.css'

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <h1>Settings</h1>
      <p className={styles.placeholder}>
        Backup, restore and other app settings will be available in a future update.
      </p>
    </div>
  )
}
