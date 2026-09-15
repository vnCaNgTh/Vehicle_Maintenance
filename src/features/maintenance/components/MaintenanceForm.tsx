import { useMemo, useRef, useState, type FormEvent } from 'react'
import type { Vehicle } from '../../vehicles/vehicle.types'
import type { MaintenanceFormInput, MaintenanceRecord } from '../maintenance.types'
import type { MaintenanceItemDefinition, MaintenanceRecordItem } from '../maintenanceItem.types'
import type { MaintenanceImage } from '../maintenanceImage.types'
import { isSupportedImageType } from '../maintenanceImage.utils'
import { validateMaintenanceForm, type MaintenanceValidationErrors } from '../maintenance.validation'
import { MaintenanceImageGallery } from './MaintenanceImageGallery'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import styles from './MaintenanceForm.module.css'

export interface MaintenanceFormValues {
  maintenanceDate: string
  odometer: number
  description: string
  cost: number
  items: MaintenanceRecordItem[]
  /** New photos the user picked in this session; not yet stored anywhere. */
  newImageFiles: File[]
}

interface PendingImage {
  id: string
  file: File
}

interface MaintenanceFormProps {
  vehicle: Vehicle
  initialRecord?: MaintenanceRecord
  catalog: MaintenanceItemDefinition[]
  submitLabel: string
  onSubmit: (values: MaintenanceFormValues) => Promise<void> | void
  onCancel?: () => void
  /** Photos already saved for this record (edit mode only). */
  existingImages?: MaintenanceImage[]
  /** Called immediately (not deferred to submit) when the user removes an already-saved photo. */
  onDeleteExistingImage?: (imageId: string) => Promise<void>
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
  existingImages = [],
  onDeleteExistingImage,
}: MaintenanceFormProps) {
  const [input, setInput] = useState<MaintenanceFormInput>(() => toFormInput(initialRecord))
  const [selectedItems, setSelectedItems] = useState<MaintenanceRecordItem[]>(() => initialRecord?.items ?? [])
  const [errors, setErrors] = useState<MaintenanceValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [savedImages, setSavedImages] = useState<MaintenanceImage[]>(existingImages)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageToDelete, setImageToDelete] = useState<MaintenanceImage | null>(null)
  const [isDeletingImage, setIsDeletingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return
    }

    const files = Array.from(fileList)
    const accepted: PendingImage[] = []
    let hasRejected = false

    for (const file of files) {
      if (isSupportedImageType(file.type)) {
        accepted.push({ id: generateLocalItemId(), file })
      } else {
        hasRejected = true
      }
    }

    setImageError(hasRejected ? 'Some files were skipped. Please choose JPEG, PNG, or WebP photos.' : null)
    if (accepted.length > 0) {
      setPendingImages((prev) => [...prev, ...accepted])
    }
  }

  function removePendingImage(id: string) {
    setPendingImages((prev) => prev.filter((image) => image.id !== id))
  }

  function requestDeleteExistingImage(id: string) {
    const target = savedImages.find((image) => image.id === id)
    if (target) {
      setImageToDelete(target)
    }
  }

  function handleRemoveGalleryImage(id: string) {
    if (pendingImages.some((image) => image.id === id)) {
      removePendingImage(id)
      return
    }
    requestDeleteExistingImage(id)
  }

  async function handleConfirmDeleteImage() {
    if (!imageToDelete || !onDeleteExistingImage) {
      return
    }
    setIsDeletingImage(true)
    try {
      await onDeleteExistingImage(imageToDelete.id)
      setSavedImages((prev) => prev.filter((image) => image.id !== imageToDelete.id))
      setImageToDelete(null)
    } catch {
      setImageError('Could not delete this photo. Please try again.')
    } finally {
      setIsDeletingImage(false)
    }
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
      await onSubmit({
        ...result.values,
        items: selectedItems,
        newImageFiles: pendingImages.map((image) => image.file),
      })
    } catch {
      setSubmitError('Something went wrong while saving. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const extraSelectedItems = selectedItems.filter(
    (item) => !catalog.some((definition) => definition.id === item.itemId),
  )

  const galleryImages = useMemo(
    () => [
      ...savedImages.map((image) => ({ id: image.id, blob: image.blob, filename: image.filename })),
      ...pendingImages.map((image) => ({ id: image.id, blob: image.file, filename: image.file.name })),
    ],
    [savedImages, pendingImages],
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
        {catalog.length === 0 && extraSelectedItems.length === 0 ? (
          <p className={styles.emptyCatalogHint}>
            No maintenance items configured. Go to Settings → Maintenance Item Catalog to add maintenance items.
          </p>
        ) : (
          <div className={styles.checklist}>
            {catalog.map((definition) => {
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
              <label key={item.itemId} className={styles.checklistItem}>
                <input type="checkbox" checked onChange={() => removeExtraItem(item.itemId)} />
                <span>
                  <span className={styles.checklistItemName}>{item.name}</span>
                  {item.reminderEnabled && item.intervalKm !== undefined && (
                    <span className={styles.checklistItemHint}>Every {item.intervalKm.toLocaleString()} km</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
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

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Receipt photos</span>
        <MaintenanceImageGallery images={galleryImages} onRemove={handleRemoveGalleryImage} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className={styles.hiddenFileInput}
          onChange={(event) => {
            handleFilesSelected(event.target.files)
            event.target.value = ''
          }}
        />
        <button type="button" className={styles.addItemButton} onClick={() => fileInputRef.current?.click()}>
          + Add photo
        </button>
        {imageError && <p className={styles.error}>{imageError}</p>}
      </div>

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

      <ConfirmDialog
        open={imageToDelete !== null}
        title="Delete this photo?"
        message="This receipt photo will be removed from this device."
        confirmLabel={isDeletingImage ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteImage}
        onCancel={() => setImageToDelete(null)}
      />
    </>
  )
}
