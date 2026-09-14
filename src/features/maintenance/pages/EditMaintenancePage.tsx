import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingState } from '../../../components/common/LoadingState'
import { EmptyState } from '../../../components/common/EmptyState'
import { MaintenanceForm, type MaintenanceFormValues } from '../components/MaintenanceForm'
import { getMaintenanceById, updateMaintenance, MaintenanceRepositoryError } from '../maintenance.repository'
import {
  addCustomMaintenanceItemToCatalog,
  getMaintenanceItemCatalog,
  MaintenanceItemCatalogRepositoryError,
} from '../maintenanceItemCatalog.repository'
import { getVehicleById, VehicleRepositoryError } from '../../vehicles/vehicle.repository'
import type { Vehicle } from '../../vehicles/vehicle.types'
import type { MaintenanceRecord } from '../maintenance.types'
import type { MaintenanceItemDefinition } from '../maintenanceItem.types'
import styles from './MaintenanceFormPage.module.css'

export function EditMaintenancePage() {
  const { vehicleId, maintenanceId } = useParams<{ vehicleId: string; maintenanceId: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined)
  const [record, setRecord] = useState<MaintenanceRecord | null | undefined>(undefined)
  const [catalog, setCatalog] = useState<MaintenanceItemDefinition[] | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!vehicleId || !maintenanceId) {
      return
    }

    let cancelled = false
    Promise.all([getVehicleById(vehicleId), getMaintenanceById(maintenanceId), getMaintenanceItemCatalog()])
      .then(([vehicleResult, recordResult, catalogResult]) => {
        if (cancelled) return
        setVehicle(vehicleResult ?? null)
        setRecord(recordResult && recordResult.vehicleId === vehicleId ? recordResult : null)
        setCatalog(catalogResult)
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof VehicleRepositoryError ||
          err instanceof MaintenanceRepositoryError ||
          err instanceof MaintenanceItemCatalogRepositoryError
            ? err.message
            : 'Could not load this maintenance record.'
        setLoadError(message)
        setVehicle(null)
        setRecord(null)
      })

    return () => {
      cancelled = true
    }
  }, [vehicleId, maintenanceId])

  async function handleSubmit(values: MaintenanceFormValues) {
    if (!record) return
    setSubmitError(null)
    try {
      await updateMaintenance({ ...record, ...values })
      navigate(`/vehicles/${record.vehicleId}`, { replace: true })
    } catch (err) {
      setSubmitError(
        err instanceof MaintenanceRepositoryError ? err.message : 'Could not update this maintenance record.',
      )
      throw err
    }
  }

  if (!vehicleId || !maintenanceId) {
    return <EmptyState title="Maintenance record not found" message="No maintenance ID was provided." />
  }

  if (vehicle === undefined || record === undefined || catalog === undefined) {
    return <LoadingState label="Loading maintenance record…" />
  }

  if (vehicle === null) {
    return (
      <EmptyState
        title="Vehicle not found"
        message={loadError ?? 'This vehicle may have been deleted from this device.'}
      />
    )
  }

  if (record === null) {
    return (
      <EmptyState
        title="Maintenance record not found"
        message={loadError ?? 'This maintenance record may have been deleted from this device.'}
      />
    )
  }

  return (
    <div className={styles.page}>
      <h1>Edit maintenance</h1>
      {submitError && <p className={styles.errorBanner}>{submitError}</p>}
      <MaintenanceForm
        vehicle={vehicle}
        initialRecord={record}
        catalog={catalog}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        onAddCustomItemToCatalog={addCustomMaintenanceItemToCatalog}
      />
    </div>
  )
}
