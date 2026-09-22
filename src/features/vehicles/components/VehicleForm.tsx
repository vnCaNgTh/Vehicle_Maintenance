import { useState, type FormEvent } from 'react'
import type { Vehicle, VehicleFormInput } from '../vehicle.types'
import { validateVehicleForm, type VehicleValidationErrors } from '../vehicle.validation'
import styles from './VehicleForm.module.css'

export interface VehicleFormValues {
  ownerName: string
  vehicleType: string
  licensePlate: string
  frameNumber: string
  engineNumber: string
  currentOdometer: number
}

interface VehicleFormProps {
  initialVehicle?: Vehicle
  submitLabel: string
  onSubmit: (values: VehicleFormValues) => Promise<void> | void
  onCancel?: () => void
}

function toFormInput(vehicle?: Vehicle): VehicleFormInput {
  return {
    ownerName: vehicle?.ownerName ?? '',
    vehicleType: vehicle?.vehicleType ?? '',
    licensePlate: vehicle?.licensePlate ?? '',
    frameNumber: vehicle?.frameNumber ?? '',
    engineNumber: vehicle?.engineNumber ?? '',
    currentOdometer: vehicle?.currentOdometer ?? '',
  }
}

export function VehicleForm({ initialVehicle, submitLabel, onSubmit, onCancel }: VehicleFormProps) {
  const [input, setInput] = useState<VehicleFormInput>(() => toFormInput(initialVehicle))
  const [errors, setErrors] = useState<VehicleValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<K extends keyof VehicleFormInput>(field: K, value: VehicleFormInput[K]) {
    setInput((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const result = validateVehicleForm(input)
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
      <div className={styles.field}>
        <label htmlFor="ownerName">Owner name</label>
        <input
          id="ownerName"
          type="text"
          value={input.ownerName}
          onChange={(event) => updateField('ownerName', event.target.value)}
          aria-invalid={Boolean(errors.ownerName)}
          aria-describedby={errors.ownerName ? 'ownerName-error' : undefined}
        />
        {errors.ownerName && (
          <p id="ownerName-error" className={styles.error}>
            {errors.ownerName}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="vehicleType">Vehicle type</label>
        <input
          id="vehicleType"
          type="text"
          placeholder="e.g. Honda Wave"
          value={input.vehicleType}
          onChange={(event) => updateField('vehicleType', event.target.value)}
          aria-invalid={Boolean(errors.vehicleType)}
          aria-describedby={errors.vehicleType ? 'vehicleType-error' : undefined}
        />
        {errors.vehicleType && (
          <p id="vehicleType-error" className={styles.error}>
            {errors.vehicleType}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="licensePlate">License plate</label>
        <input
          id="licensePlate"
          type="text"
          value={input.licensePlate}
          onChange={(event) => updateField('licensePlate', event.target.value)}
          aria-invalid={Boolean(errors.licensePlate)}
          aria-describedby={errors.licensePlate ? 'licensePlate-error' : undefined}
        />
        {errors.licensePlate && (
          <p id="licensePlate-error" className={styles.error}>
            {errors.licensePlate}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="currentOdometer">Last maintenance odometer (km)</label>
        <input
          id="currentOdometer"
          type="number"
          inputMode="numeric"
          min={0}
          value={input.currentOdometer}
          onChange={(event) => updateField('currentOdometer', event.target.value)}
          aria-invalid={Boolean(errors.currentOdometer)}
          aria-describedby={errors.currentOdometer ? 'currentOdometer-error' : undefined}
        />
        {errors.currentOdometer && (
          <p id="currentOdometer-error" className={styles.error}>
            {errors.currentOdometer}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="frameNumber">Frame number (optional)</label>
        <input
          id="frameNumber"
          type="text"
          value={input.frameNumber}
          onChange={(event) => updateField('frameNumber', event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="engineNumber">Engine number (optional)</label>
        <input
          id="engineNumber"
          type="text"
          value={input.engineNumber}
          onChange={(event) => updateField('engineNumber', event.target.value)}
        />
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
