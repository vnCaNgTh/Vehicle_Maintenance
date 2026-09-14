import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LoadingState } from '../../../components/common/LoadingState'
import { EmptyState } from '../../../components/common/EmptyState'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import { deleteMaintenance, getMaintenanceById, MaintenanceRepositoryError } from '../maintenance.repository'
import { getVehicleById, VehicleRepositoryError } from '../../vehicles/vehicle.repository'
import { getImagesByMaintenanceId, MaintenanceImageRepositoryError } from '../maintenanceImage.repository'
import { MaintenanceImageGallery } from '../components/MaintenanceImageGallery'
import type { Vehicle } from '../../vehicles/vehicle.types'
import type { MaintenanceRecord } from '../maintenance.types'
import type { MaintenanceImage } from '../maintenanceImage.types'
import { formatCurrency, formatDate } from '../../../shared/format'
import styles from './MaintenanceDetailPage.module.css'

export function MaintenanceDetailPage() {
  const { vehicleId, maintenanceId } = useParams<{ vehicleId: string; maintenanceId: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined)
  const [record, setRecord] = useState<MaintenanceRecord | null | undefined>(undefined)
  const [images, setImages] = useState<MaintenanceImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!vehicleId || !maintenanceId) {
      return
    }

    let cancelled = false
    Promise.all([getVehicleById(vehicleId), getMaintenanceById(maintenanceId), getImagesByMaintenanceId(maintenanceId)])
      .then(([vehicleResult, recordResult, imagesResult]) => {
        if (cancelled) return
        setVehicle(vehicleResult ?? null)
        setRecord(recordResult && recordResult.vehicleId === vehicleId ? recordResult : null)
        setImages(imagesResult)
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof VehicleRepositoryError ||
          err instanceof MaintenanceRepositoryError ||
          err instanceof MaintenanceImageRepositoryError
            ? err.message
            : 'Could not load this maintenance record.'
        setError(message)
        setVehicle(null)
        setRecord(null)
      })

    return () => {
      cancelled = true
    }
  }, [vehicleId, maintenanceId])

  async function handleDelete() {
    if (!record) return
    setIsDeleting(true)
    try {
      await deleteMaintenance(record.id)
      navigate(`/vehicles/${record.vehicleId}`, { replace: true })
    } catch (err) {
      setError(err instanceof MaintenanceRepositoryError ? err.message : 'Could not delete this maintenance record.')
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }

  const galleryImages = useMemo(
    () => images.map((image) => ({ id: image.id, blob: image.blob, filename: image.filename })),
    [images],
  )

  if (!vehicleId || !maintenanceId) {
    return <EmptyState title="Maintenance record not found" message="No maintenance ID was provided." />
  }

  if (vehicle === undefined || record === undefined) {
    return <LoadingState label="Loading maintenance record…" />
  }

  if (vehicle === null) {
    return (
      <EmptyState
        title="Vehicle not found"
        message={error ?? 'This vehicle may have been deleted from this device.'}
        action={
          <Link to="/vehicles" className={styles.backLink}>
            Back to vehicles
          </Link>
        }
      />
    )
  }

  if (record === null) {
    return (
      <EmptyState
        title="Maintenance record not found"
        message={error ?? 'This maintenance record may have been deleted from this device.'}
        action={
          <Link to={`/vehicles/${vehicleId}`} className={styles.backLink}>
            Back to vehicle
          </Link>
        }
      />
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>{formatDate(record.maintenanceDate)}</h1>
        <span className={styles.cost}>{formatCurrency(record.cost)}</span>
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      <dl className={styles.details}>
        <div className={styles.row}>
          <dt>Vehicle</dt>
          <dd>
            {vehicle.vehicleType} · {vehicle.licensePlate}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Odometer</dt>
          <dd>{record.odometer.toLocaleString()} km</dd>
        </div>
        {record.items.length > 0 && (
          <div className={styles.row}>
            <dt>Items</dt>
            <dd>
              <ul className={styles.itemsList}>
                {record.items.map((item) => (
                  <li key={item.itemId}>
                    {item.name}
                    {item.reminderEnabled && item.nextOdo !== undefined && (
                      <span className={styles.itemReminder}> · Next: {item.nextOdo.toLocaleString()} km</span>
                    )}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {record.description && (
          <div className={styles.row}>
            <dt>Note</dt>
            <dd className={styles.description}>{record.description}</dd>
          </div>
        )}
      </dl>

      <div className={styles.photosSection}>
        <h2 className={styles.photosHeading}>Receipt photos</h2>
        <MaintenanceImageGallery images={galleryImages} emptyMessage="No receipt photos." />
      </div>

      <div className={styles.actions}>
        <Link to={`/vehicles/${vehicleId}/maintenance/${record.id}/edit`} className={styles.editButton}>
          Edit
        </Link>
        <button type="button" className={styles.deleteButton} onClick={() => setIsConfirmOpen(true)}>
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Delete maintenance record?"
        message="This maintenance record will be removed from this device."
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
