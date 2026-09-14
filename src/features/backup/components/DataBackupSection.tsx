import { useId, useRef, useState } from 'react'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import {
  BackupValidationError,
  getLastBackupAt,
  loadAndValidateBackupFile,
  performBackup,
  restoreFromBackup,
  type LoadedBackup,
} from '../backup.service'
import styles from './DataBackupSection.module.css'

type BackupState = 'idle' | 'working' | 'error'
type RestoreStage = 'idle' | 'validating' | 'confirming' | 'restoring' | 'success' | 'error'

function formatTimestamp(isoDate: string): string {
  const parsed = new Date(isoDate)
  return Number.isNaN(parsed.getTime()) ? isoDate : parsed.toLocaleString('en-GB')
}

function describeError(error: unknown): string[] {
  if (error instanceof BackupValidationError) {
    return error.errors
  }
  if (error instanceof Error) {
    return [error.message]
  }
  return ['Something went wrong. Please try again.']
}

export function DataBackupSection() {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [lastBackupAt, setLastBackupAt] = useState<string | null>(() => getLastBackupAt())
  const [backupState, setBackupState] = useState<BackupState>('idle')
  const [backupErrors, setBackupErrors] = useState<string[]>([])

  const [restoreStage, setRestoreStage] = useState<RestoreStage>('idle')
  const [restoreErrors, setRestoreErrors] = useState<string[]>([])
  const [pendingBackup, setPendingBackup] = useState<LoadedBackup | null>(null)
  const [backupFirst, setBackupFirst] = useState(true)

  async function handleBackupNow() {
    setBackupState('working')
    setBackupErrors([])
    try {
      await performBackup()
      setLastBackupAt(getLastBackupAt())
      setBackupState('idle')
    } catch (error) {
      setBackupState('error')
      setBackupErrors(describeError(error))
    }
  }

  function handleRestoreButtonClick() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so choosing the same file again still fires a change event.
    event.target.value = ''
    if (!file) {
      return
    }

    setRestoreStage('validating')
    setRestoreErrors([])
    try {
      const loaded = await loadAndValidateBackupFile(file)
      setPendingBackup(loaded)
      setRestoreStage('confirming')
    } catch (error) {
      setPendingBackup(null)
      setRestoreStage('error')
      setRestoreErrors(describeError(error))
    }
  }

  function handleCancelRestore() {
    setPendingBackup(null)
    setRestoreStage('idle')
  }

  async function handleConfirmRestore() {
    if (!pendingBackup) {
      return
    }
    setRestoreStage('restoring')
    try {
      if (backupFirst) {
        await performBackup()
        setLastBackupAt(getLastBackupAt())
      }
      await restoreFromBackup(pendingBackup.archive)
      setPendingBackup(null)
      setRestoreStage('success')
    } catch (error) {
      setRestoreStage('error')
      setRestoreErrors(describeError(error))
    }
  }

  const summary = pendingBackup?.summary

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Data &amp; Backup</h2>
      <p className={styles.description}>
        Back up all local data - vehicles, maintenance records, checklist items and receipt photos - to a single
        file you can keep safe or move to a new device.
      </p>

      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleBackupNow}
          disabled={backupState === 'working'}
        >
          {backupState === 'working' ? 'Creating backup…' : 'Backup Now'}
        </button>
        <p className={styles.lastBackup}>
          Last backup: {lastBackupAt ? formatTimestamp(lastBackupAt) : 'Never on this device'}
        </p>
      </div>

      {backupState === 'error' && backupErrors.length > 0 && (
        <p className={styles.errorText} role="alert">
          Could not create a backup: {backupErrors[0]}
        </p>
      )}

      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleRestoreButtonClick}
          disabled={restoreStage === 'validating' || restoreStage === 'restoring'}
        >
          {restoreStage === 'validating' ? 'Checking backup…' : 'Restore Backup'}
        </button>
        <label htmlFor={fileInputId} className={styles.visuallyHidden}>
          Select a backup ZIP file to restore
        </label>
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          className={styles.hiddenFileInput}
          onChange={handleFileSelected}
        />
      </div>

      {restoreStage === 'error' && restoreErrors.length > 0 && (
        <div className={styles.errorText} role="alert">
          <p>This backup could not be restored. Your existing data was not changed.</p>
          <ul className={styles.errorList}>
            {restoreErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {restoreStage === 'success' && (
        <div className={styles.successBox} role="status">
          <p>Restore complete. Reload the app to see the restored data everywhere.</p>
          <button type="button" className={styles.primaryButton} onClick={() => window.location.reload()}>
            Reload app
          </button>
        </div>
      )}

      <ConfirmDialog
        open={restoreStage === 'confirming' && summary !== undefined}
        title="Restore backup?"
        message="Restoring this backup will replace the current local data. This cannot be undone."
        confirmLabel={restoreStage === 'restoring' ? 'Restoring…' : 'Restore'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmRestore}
        onCancel={handleCancelRestore}
      >
        {summary && (
          <div className={styles.summaryBox}>
            <p>
              {summary.counts.vehicles} vehicle(s) · {summary.counts.maintenanceRecords} maintenance record(s) ·{' '}
              {summary.counts.maintenanceItemDefinitions} checklist item(s) · {summary.counts.maintenanceImages}{' '}
              photo(s)
            </p>
            <p className={styles.summaryMeta}>
              Created {formatTimestamp(summary.createdAt)} · App v{summary.appVersion} · DB v{summary.databaseVersion}
            </p>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={backupFirst}
                onChange={(event) => setBackupFirst(event.target.checked)}
              />
              Also back up my current data before restoring
            </label>
          </div>
        )}
      </ConfirmDialog>
    </section>
  )
}
