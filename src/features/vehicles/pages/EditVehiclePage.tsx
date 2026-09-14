import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingState } from '../../../components/common/LoadingState'
import { EmptyState } from '../../../components/common/EmptyState'
import { VehicleForm, type VehicleFormValues } from '../components/VehicleForm'
import { getVehicleById, updateVehicle, VehicleRepositoryError } from '../vehicle.repository'
import type { Vehicle } from '../vehicle.types'
import styles from './VehicleFormPage.module.css'

export function EditVehiclePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
        setLoadError(err instanceof VehicleRepositoryError ? err.message : 'Could not load this vehicle.')
        setVehicle(null)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSubmit(values: VehicleFormValues) {
    if (!vehicle) return
    setSubmitError(null)
    try {
      await updateVehicle({ ...vehicle, ...values })
      navigate(`/vehicles/${vehicle.id}`, { replace: true })
    } catch (err) {
      setSubmitError(err instanceof VehicleRepositoryError ? err.message : 'Could not update this vehicle.')
      throw err
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
      <EmptyState
        title="Vehicle not found"
        message={loadError ?? 'This vehicle may have been deleted from this device.'}
      />
    )
  }

  return (
    <div className={styles.page}>
      <h1>Edit vehicle</h1>
      {submitError && <p className={styles.errorBanner}>{submitError}</p>}
      <VehicleForm
        initialVehicle={vehicle}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  )
}
