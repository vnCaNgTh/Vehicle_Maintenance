import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingState } from '../../../components/common/LoadingState'
import { EmptyState } from '../../../components/common/EmptyState'
import { MaintenanceForm, type MaintenanceFormValues } from '../components/MaintenanceForm'
import { createMaintenance, MaintenanceRepositoryError } from '../maintenance.repository'
import {
  addCustomMaintenanceItemToCatalog,
  getMaintenanceItemCatalog,
  MaintenanceItemCatalogRepositoryError,
} from '../maintenanceItemCatalog.repository'
import { addImage } from '../maintenanceImage.repository'
import { processImageFile } from '../maintenanceImage.utils'
import { getVehicleById, VehicleRepositoryError } from '../../vehicles/vehicle.repository'
import type { Vehicle } from '../../vehicles/vehicle.types'
import type { MaintenanceItemDefinition } from '../maintenanceItem.types'
import styles from './MaintenanceFormPage.module.css'

export function AddMaintenancePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined)
  const [catalog, setCatalog] = useState<MaintenanceItemDefinition[] | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!vehicleId) {
      return
    }

    let cancelled = false
    Promise.all([getVehicleById(vehicleId), getMaintenanceItemCatalog()])
      .then(([vehicleResult, catalogResult]) => {
        if (cancelled) return
        setVehicle(vehicleResult ?? null)
        setCatalog(catalogResult)
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof VehicleRepositoryError || err instanceof MaintenanceItemCatalogRepositoryError
            ? err.message
            : 'Could not load this vehicle.'
        setLoadError(message)
        setVehicle(null)
      })

    return () => {
      cancelled = true
    }
  }, [vehicleId])

  async function handleSubmit(values: MaintenanceFormValues) {
    if (!vehicle) return
    setSubmitError(null)

    const { newImageFiles, ...recordValues } = values
    let record
    try {
      record = await createMaintenance({ vehicleId: vehicle.id, ...recordValues })
    } catch (err) {
      setSubmitError(err instanceof MaintenanceRepositoryError ? err.message : 'Could not save this maintenance record.')
      throw err
    }

    const failedFilenames: string[] = []
    for (const file of newImageFiles) {
      try {
        const processed = await processImageFile(file)
        await addImage({
          maintenanceId: record.id,
          blob: processed.blob,
          filename: file.name,
          mimeType: processed.mimeType,
          size: processed.size,
        })
      } catch {
        failedFilenames.push(file.name)
      }
    }

    if (failedFilenames.length > 0) {
      setSubmitError(
        `Maintenance saved, but ${failedFilenames.length} photo(s) could not be saved: ${failedFilenames.join(', ')}. You can try adding them again from Edit.`,
      )
      return
    }

    navigate(`/vehicles/${vehicle.id}`, { replace: true })
  }

  if (!vehicleId) {
    return <EmptyState title="Vehicle not found" message="No vehicle ID was provided." />
  }

  if (vehicle === undefined || catalog === undefined) {
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
        catalog={catalog}
        submitLabel="Add maintenance"
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        onAddCustomItemToCatalog={addCustomMaintenanceItemToCatalog}
      />
    </div>
  )
}
