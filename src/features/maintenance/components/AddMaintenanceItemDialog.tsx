import { useState, type FormEvent } from 'react'
import {
  validateCustomMaintenanceItemForm,
  type CustomMaintenanceItemValidationErrors,
} from '../maintenanceItem.validation'
import styles from './AddMaintenanceItemDialog.module.css'

export interface CustomMaintenanceItemSubmission {
  name: string
  reminderEnabled: boolean
  intervalKm?: number
  saveToCatalog: boolean
}

interface AddMaintenanceItemDialogProps {
  open: boolean
  onAdd: (submission: CustomMaintenanceItemSubmission) => Promise<void> | void
  onClose: () => void
}

/** Small modal for creating a custom checklist item, styled like ConfirmDialog. */
export function AddMaintenanceItemDialog({ open, onAdd, onClose }: AddMaintenanceItemDialogProps) {
  const [name, setName] = useState('')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [intervalKm, setIntervalKm] = useState<number | string>('')
  const [saveToCatalog, setSaveToCatalog] = useState(false)
  const [errors, setErrors] = useState<CustomMaintenanceItemValidationErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!open) {
    return null
  }

  function resetFields() {
    setName('')
    setReminderEnabled(false)
    setIntervalKm('')
    setSaveToCatalog(false)
    setErrors({})
    setSubmitError(null)
  }

  function handleClose() {
    resetFields()
    onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const result = validateCustomMaintenanceItemForm({ name, reminderEnabled, intervalKm })
    setErrors(result.errors)

    if (!result.isValid) {
      return
    }

    setIsSubmitting(true)
    try {
      await onAdd({
        name: result.values.name,
        reminderEnabled: result.values.reminderEnabled,
        intervalKm: result.values.intervalKm,
        saveToCatalog,
      })
      resetFields()
      onClose()
    } catch {
      setSubmitError('Could not add this item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={handleClose}>
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
      >
        <h2 id="add-item-dialog-title" className={styles.title}>
          Add maintenance item
        </h2>

        <div className={styles.field}>
          <label htmlFor="custom-item-name">Item name</label>
          <input
            id="custom-item-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'custom-item-name-error' : undefined}
          />
          {errors.name && (
            <p id="custom-item-name-error" className={styles.error}>
              {errors.name}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Reminder</span>
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                name="custom-item-reminder"
                checked={!reminderEnabled}
                onChange={() => setReminderEnabled(false)}
              />
              No
            </label>
            <label>
              <input
                type="radio"
                name="custom-item-reminder"
                checked={reminderEnabled}
                onChange={() => setReminderEnabled(true)}
              />
              Yes
            </label>
          </div>
        </div>

        {reminderEnabled && (
          <div className={styles.field}>
            <label htmlFor="custom-item-interval">ODO interval (km)</label>
            <input
              id="custom-item-interval"
              type="number"
              inputMode="numeric"
              min={0}
              value={intervalKm}
              onChange={(event) => setIntervalKm(event.target.value)}
              aria-invalid={Boolean(errors.intervalKm)}
              aria-describedby={errors.intervalKm ? 'custom-item-interval-error' : undefined}
            />
            {errors.intervalKm && (
              <p id="custom-item-interval-error" className={styles.error}>
                {errors.intervalKm}
              </p>
            )}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={saveToCatalog}
              onChange={(event) => setSaveToCatalog(event.target.checked)}
            />
            Save to default checklist
          </label>
        </div>

        {submitError && <p className={styles.error}>{submitError}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className={styles.confirmButton} disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
