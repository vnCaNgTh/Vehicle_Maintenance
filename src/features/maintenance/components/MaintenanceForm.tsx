import { useState, type FormEvent } from 'react'
import type { Vehicle } from '../../vehicles/vehicle.types'
import type { MaintenanceFormInput, MaintenanceRecord } from '../maintenance.types'
import { validateMaintenanceForm, type MaintenanceValidationErrors } from '../maintenance.validation'
import styles from './MaintenanceForm.module.css'

export interface MaintenanceFormValues {
  maintenanceDate: string
  odometer: number
  description: string
  cost: number
}

interface MaintenanceFormProps {
  vehicle: Vehicle
  initialRecord?: MaintenanceRecord
  submitLabel: string
  onSubmit: (values: MaintenanceFormValues) => Promise<void> | void
  onCancel?: () => void
}

function todayAsDateInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

function toFormInput(record?: MaintenanceRecord): MaintenanceFormInput {
  return {
    maintenanceDate: record?.maintenanceDate ?? todayAsDateInputValue(),
    odometer: record?.odometer ?? '',
    description: record?.description ?? '',
    cost: record?.cost ?? '',
  }
}

export function MaintenanceForm({ vehicle, initialRecord, submitLabel, onSubmit, onCancel }: MaintenanceFormProps) {
  const [input, setInput] = useState<MaintenanceFormInput>(() => toFormInput(initialRecord))
  const [errors, setErrors] = useState<MaintenanceValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<K extends keyof MaintenanceFormInput>(field: K, value: MaintenanceFormInput[K]) {
    setInput((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const result = validateMaintenanceForm(input)
    setErrors(result.errors)

    if (!result.isValid) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(result.values)
    } catch {
      setSubmitError('Something went wrong while saving. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.vehicleSummary}>
        <span className={styles.vehicleType}>{vehicle.vehicleType}</span>
        <span className={styles.vehiclePlate}>{vehicle.licensePlate}</span>
      </div>

      <div className={styles.field}>
        <label htmlFor="maintenanceDate">Date</label>
        <input
          id="maintenanceDate"
          type="date"
          value={input.maintenanceDate}
          onChange={(event) => updateField('maintenanceDate', event.target.value)}
          aria-invalid={Boolean(errors.maintenanceDate)}
          aria-describedby={errors.maintenanceDate ? 'maintenanceDate-error' : undefined}
        />
        {errors.maintenanceDate && (
          <p id="maintenanceDate-error" className={styles.error}>
            {errors.maintenanceDate}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="odometer">Odometer (km)</label>
        <input
          id="odometer"
          type="number"
          inputMode="numeric"
          min={0}
          value={input.odometer}
          onChange={(event) => updateField('odometer', event.target.value)}
          aria-invalid={Boolean(errors.odometer)}
          aria-describedby={errors.odometer ? 'odometer-error' : undefined}
        />
        {errors.odometer && (
          <p id="odometer-error" className={styles.error}>
            {errors.odometer}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={3}
          placeholder="e.g. Thay nhớt máy, vệ sinh lọc gió"
          value={input.description}
          onChange={(event) => updateField('description', event.target.value)}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className={styles.error}>
            {errors.description}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="cost">Cost (₫)</label>
        <input
          id="cost"
          type="number"
          inputMode="numeric"
          min={0}
          value={input.cost}
          onChange={(event) => updateField('cost', event.target.value)}
          aria-invalid={Boolean(errors.cost)}
          aria-describedby={errors.cost ? 'cost-error' : undefined}
        />
        {errors.cost && (
          <p id="cost-error" className={styles.error}>
            {errors.cost}
          </p>
        )}
      </div>

      {submitError && <p className={styles.error}>{submitError}</p>}

      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        )}
        <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
