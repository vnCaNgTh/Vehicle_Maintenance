import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LoadingState } from '../../../components/common/LoadingState'
import { EmptyState } from '../../../components/common/EmptyState'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import { deleteVehicle, getVehicleById, VehicleRepositoryError } from '../vehicle.repository'
import type { Vehicle } from '../vehicle.types'
import styles from './VehicleDetailPage.module.css'

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!id) {
      return
    }

    let cancelled = false
    getVehicleById(id)
      .then((result) => {
        if (!cancelled) setVehicle(result ?? null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof VehicleRepositoryError ? err.message : 'Could not load this vehicle.')
        setVehicle(null)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleDelete() {
    if (!vehicle) return
    setIsDeleting(true)
    try {
      await deleteVehicle(vehicle.id)
      navigate('/vehicles', { replace: true })
    } catch (err) {
      setError(err instanceof VehicleRepositoryError ? err.message : 'Could not delete this vehicle.')
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }

  if (!id) {
    return <EmptyState title="Vehicle not found" message="No vehicle ID was provided." />
  }

  if (vehicle === undefined) {
    return <LoadingState label="Loading vehicle…" />
  }

  if (vehicle === null) {
    return (
      <EmptyState title="Vehicle not found" message={error ?? 'This vehicle may have been deleted from this device.'} />
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>{vehicle.vehicleType}</h1>
        <span className={styles.plate}>{vehicle.licensePlate}</span>
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      <dl className={styles.details}>
        <div className={styles.row}>
          <dt>Owner</dt>
          <dd>{vehicle.ownerName}</dd>
        </div>
        <div className={styles.row}>
          <dt>Frame number</dt>
          <dd>{vehicle.frameNumber || '—'}</dd>
        </div>
        <div className={styles.row}>
          <dt>Engine number</dt>
          <dd>{vehicle.engineNumber || '—'}</dd>
        </div>
        <div className={styles.row}>
          <dt>Current odometer</dt>
          <dd>{vehicle.currentOdometer.toLocaleString()} km</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Link to={`/vehicles/${vehicle.id}/edit`} className={styles.editButton}>
          Edit
        </Link>
        <button type="button" className={styles.deleteButton} onClick={() => setIsConfirmOpen(true)}>
          Delete
        </button>
      </div>

      <section className={styles.maintenanceSection}>
        <h2>Maintenance history</h2>
        <p>No maintenance records yet.</p>
      </section>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Delete vehicle?"
        message="This vehicle and its information will be removed from this device."
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
