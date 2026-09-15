import { useState, type FormEvent } from 'react'
import {
  validateCustomMaintenanceItemForm,
  type CustomMaintenanceItemValidationErrors,
} from '../maintenanceItem.validation'
import type { MaintenanceItemDefinition } from '../maintenanceItem.types'
import styles from './CatalogItemDialog.module.css'

export interface CatalogItemSubmission {
  name: string
  reminderEnabled: boolean
  intervalKm?: number
}

interface CatalogItemDialogProps {
  open: boolean
  /** When set, the dialog edits this item instead of creating a new one. */
  initialItem?: MaintenanceItemDefinition | null
  onSubmit: (submission: CatalogItemSubmission) => Promise<void> | void
  onClose: () => void
}

/**
 * Add/edit modal for a single Maintenance Item Catalog entry.
 * Render with a fresh `key` (e.g. per open) so its form state resets
 * naturally on remount instead of via an effect-driven reset.
 */
export function CatalogItemDialog({ open, initialItem, onSubmit, onClose }: CatalogItemDialogProps) {
  const [name, setName] = useState(initialItem?.name ?? '')
  const [reminderEnabled, setReminderEnabled] = useState(initialItem?.reminderEnabled ?? false)
  const [intervalKm, setIntervalKm] = useState<number | string>(initialItem?.intervalKm ?? '')
  const [errors, setErrors] = useState<CustomMaintenanceItemValidationErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = Boolean(initialItem)

  if (!open) {
    return null
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
      await onSubmit({
        name: result.values.name,
        reminderEnabled: result.values.reminderEnabled,
        intervalKm: result.values.intervalKm,
      })
      onClose()
    } catch {
      setSubmitError(isEditing ? 'Could not save these changes. Please try again.' : 'Could not add this item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-item-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
      >
        <h2 id="catalog-item-dialog-title" className={styles.title}>
          {isEditing ? 'Edit maintenance item' : 'Add maintenance item'}
        </h2>

        <div className={styles.field}>
          <label htmlFor="catalog-item-name">Item name</label>
          <input
            id="catalog-item-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'catalog-item-name-error' : undefined}
          />
          {errors.name && (
            <p id="catalog-item-name-error" className={styles.error}>
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
                name="catalog-item-reminder"
                checked={!reminderEnabled}
                onChange={() => setReminderEnabled(false)}
              />
              No
            </label>
            <label>
              <input
                type="radio"
                name="catalog-item-reminder"
                checked={reminderEnabled}
                onChange={() => setReminderEnabled(true)}
              />
              Yes
            </label>
          </div>
        </div>

        {reminderEnabled && (
          <div className={styles.field}>
            <label htmlFor="catalog-item-interval">ODO interval (km)</label>
            <input
              id="catalog-item-interval"
              type="number"
              inputMode="numeric"
              min={0}
              value={intervalKm}
              onChange={(event) => setIntervalKm(event.target.value)}
              aria-invalid={Boolean(errors.intervalKm)}
              aria-describedby={errors.intervalKm ? 'catalog-item-interval-error' : undefined}
            />
            {errors.intervalKm && (
              <p id="catalog-item-interval-error" className={styles.error}>
                {errors.intervalKm}
              </p>
            )}
          </div>
        )}

        {submitError && <p className={styles.error}>{submitError}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className={styles.confirmButton} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
