import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingState } from '../../../components/common/LoadingState'
import { EmptyState } from '../../../components/common/EmptyState'
import { MaintenanceForm, type MaintenanceFormValues } from '../components/MaintenanceForm'
import { createMaintenance, MaintenanceRepositoryError } from '../maintenance.repository'
import { getVehicleById, VehicleRepositoryError } from '../../vehicles/vehicle.repository'
import type { Vehicle } from '../../vehicles/vehicle.types'
import styles from './MaintenanceFormPage.module.css'

export function AddMaintenancePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!vehicleId) {
      return
    }

    let cancelled = false
    getVehicleById(vehicleId)
      .then((result) => {
        if (!cancelled) setVehicle(result ?? null)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof VehicleRepositoryError ? err.message : 'Could not load this vehicle.')
        setVehicle(null)
      })

    return () => {
      cancelled = true
    }
  }, [vehicleId])

  async function handleSubmit(values: MaintenanceFormValues) {
    if (!vehicle) return
    setSubmitError(null)
    try {
      await createMaintenance({ vehicleId: vehicle.id, ...values })
      navigate(`/vehicles/${vehicle.id}`, { replace: true })
    } catch (err) {
      setSubmitError(err instanceof MaintenanceRepositoryError ? err.message : 'Could not save this maintenance record.')
      throw err
    }
  }

  if (!vehicleId) {
    return <EmptyState title="Vehicle not found" message="No vehicle ID was provided." />
  }

  if (vehicle === undefined) {
    return <LoadingState label="Loading vehicle…" />
  }

  if (vehicle === null) {
    return (
      <EmptyState
        title="Vehicle not found"
        message={loadError ?? 'This vehicle may have been deleted from this device.'}
      />
    )
  }

  return (
    <div className={styles.page}>
      <h1>Add maintenance</h1>
      {submitError && <p className={styles.errorBanner}>{submitError}</p>}
      <MaintenanceForm
        vehicle={vehicle}
        submitLabel="Add maintenance"
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  )
}
