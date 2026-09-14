import { useState, type FormEvent } from 'react'
import type { Vehicle } from '../../vehicles/vehicle.types'
import type { MaintenanceFormInput, MaintenanceRecord } from '../maintenance.types'
import type { MaintenanceItemDefinition, MaintenanceRecordItem } from '../maintenanceItem.types'
import { validateMaintenanceForm, type MaintenanceValidationErrors } from '../maintenance.validation'
import { AddMaintenanceItemDialog, type CustomMaintenanceItemSubmission } from './AddMaintenanceItemDialog'
import styles from './MaintenanceForm.module.css'

export interface MaintenanceFormValues {
  maintenanceDate: string
  odometer: number
  description: string
  cost: number
  items: MaintenanceRecordItem[]
}

interface MaintenanceFormProps {
  vehicle: Vehicle
  initialRecord?: MaintenanceRecord
  catalog: MaintenanceItemDefinition[]
  submitLabel: string
  onSubmit: (values: MaintenanceFormValues) => Promise<void> | void
  onCancel?: () => void
  onAddCustomItemToCatalog?: (input: {
    name: string
    reminderEnabled: boolean
    intervalKm?: number
  }) => Promise<MaintenanceItemDefinition>
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

function generateLocalItemId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function MaintenanceForm({
  vehicle,
  initialRecord,
  catalog,
  submitLabel,
  onSubmit,
  onCancel,
  onAddCustomItemToCatalog,
}: MaintenanceFormProps) {
  const [input, setInput] = useState<MaintenanceFormInput>(() => toFormInput(initialRecord))
  const [localCatalog, setLocalCatalog] = useState<MaintenanceItemDefinition[]>(catalog)
  const [selectedItems, setSelectedItems] = useState<MaintenanceRecordItem[]>(() => initialRecord?.items ?? [])
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [errors, setErrors] = useState<MaintenanceValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<K extends keyof MaintenanceFormInput>(field: K, value: MaintenanceFormInput[K]) {
    setInput((prev) => ({ ...prev, [field]: value }))
  }

  function toggleCatalogItem(definition: MaintenanceItemDefinition) {
    setSelectedItems((prev) => {
      if (prev.some((item) => item.itemId === definition.id)) {
        return prev.filter((item) => item.itemId !== definition.id)
      }
      return [
        ...prev,
        {
          itemId: definition.id,
          name: definition.name,
          reminderEnabled: definition.reminderEnabled,
          intervalKm: definition.intervalKm,
        },
      ]
    })
  }

  function removeExtraItem(itemId: string) {
    setSelectedItems((prev) => prev.filter((item) => item.itemId !== itemId))
  }

  async function handleAddCustomItem(submission: CustomMaintenanceItemSubmission) {
    let itemId = generateLocalItemId()
    let name = submission.name
    let reminderEnabled = submission.reminderEnabled
    let intervalKm = submission.intervalKm

    if (submission.saveToCatalog && onAddCustomItemToCatalog) {
      const saved = await onAddCustomItemToCatalog({
        name: submission.name,
        reminderEnabled: submission.reminderEnabled,
        intervalKm: submission.intervalKm,
      })
      itemId = saved.id
      name = saved.name
      reminderEnabled = saved.reminderEnabled
      intervalKm = saved.intervalKm
      setLocalCatalog((prev) => [...prev, saved])
    }

    setSelectedItems((prev) => [...prev, { itemId, name, reminderEnabled, intervalKm }])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const result = validateMaintenanceForm(input, selectedItems)
    setErrors(result.errors)

    if (!result.isValid) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({ ...result.values, items: selectedItems })
    } catch {
      setSubmitError('Something went wrong while saving. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const extraSelectedItems = selectedItems.filter(
    (item) => !localCatalog.some((definition) => definition.id === item.itemId),
  )

  return (
    <>
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
        <span className={styles.fieldLabel}>Maintenance items</span>
        <div className={styles.checklist}>
          {localCatalog.map((definition) => {
            const checked = selectedItems.some((item) => item.itemId === definition.id)
            return (
              <label key={definition.id} className={styles.checklistItem}>
                <input type="checkbox" checked={checked} onChange={() => toggleCatalogItem(definition)} />
                <span>
                  <span className={styles.checklistItemName}>{definition.name}</span>
                  {definition.reminderEnabled && definition.intervalKm !== undefined && (
                    <span className={styles.checklistItemHint}>
                      Every {definition.intervalKm.toLocaleString()} km
                    </span>
                  )}
                </span>
              </label>
            )
          })}
          {extraSelectedItems.map((item) => (
            <div key={item.itemId} className={styles.extraItem}>
              <span>
                <span className={styles.checklistItemName}>{item.name}</span>
                {item.reminderEnabled && item.intervalKm !== undefined && (
                  <span className={styles.checklistItemHint}>Every {item.intervalKm.toLocaleString()} km</span>
                )}
              </span>
              <button
                type="button"
                className={styles.removeItemButton}
                onClick={() => removeExtraItem(item.itemId)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={styles.addItemButton} onClick={() => setIsAddItemDialogOpen(true)}>
          + Add maintenance item
        </button>
        {errors.items && <p className={styles.error}>{errors.items}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Note (optional)</label>
        <textarea
          id="description"
          rows={3}
          placeholder="e.g. Vệ sinh sên, kiểm tra phanh"
          value={input.description}
          onChange={(event) => updateField('description', event.target.value)}
        />
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

      <AddMaintenanceItemDialog
        open={isAddItemDialogOpen}
        onAdd={handleAddCustomItem}
        onClose={() => setIsAddItemDialogOpen(false)}
      />
    </>
  )
}
