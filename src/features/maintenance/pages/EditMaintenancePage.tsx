import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingState } from '../../../components/common/LoadingState'
import { EmptyState } from '../../../components/common/EmptyState'
import { MaintenanceForm, type MaintenanceFormValues } from '../components/MaintenanceForm'
import { getMaintenanceById, updateMaintenance, MaintenanceRepositoryError } from '../maintenance.repository'
import {
  getMaintenanceItemCatalog,
  MaintenanceItemCatalogRepositoryError,
} from '../maintenanceItemCatalog.repository'
import {
  addImage,
  deleteImage,
  getImagesByMaintenanceId,
  MaintenanceImageRepositoryError,
} from '../maintenanceImage.repository'
import { processImageFile } from '../maintenanceImage.utils'
import { getVehicleById, VehicleRepositoryError } from '../../vehicles/vehicle.repository'
import type { Vehicle } from '../../vehicles/vehicle.types'
import type { MaintenanceRecord } from '../maintenance.types'
import type { MaintenanceItemDefinition } from '../maintenanceItem.types'
import type { MaintenanceImage } from '../maintenanceImage.types'
import styles from './MaintenanceFormPage.module.css'

export function EditMaintenancePage() {
  const { vehicleId, maintenanceId } = useParams<{ vehicleId: string; maintenanceId: string }>()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState<Vehicle | null | undefined>(undefined)
  const [record, setRecord] = useState<MaintenanceRecord | null | undefined>(undefined)
  const [catalog, setCatalog] = useState<MaintenanceItemDefinition[] | undefined>(undefined)
  const [images, setImages] = useState<MaintenanceImage[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!vehicleId || !maintenanceId) {
      return
    }

    let cancelled = false
    Promise.all([
      getVehicleById(vehicleId),
      getMaintenanceById(maintenanceId),
      getMaintenanceItemCatalog(),
      getImagesByMaintenanceId(maintenanceId),
    ])
      .then(([vehicleResult, recordResult, catalogResult, imagesResult]) => {
        if (cancelled) return
        setVehicle(vehicleResult ?? null)
        setRecord(recordResult && recordResult.vehicleId === vehicleId ? recordResult : null)
        setCatalog(catalogResult)
        setImages(imagesResult)
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof VehicleRepositoryError ||
          err instanceof MaintenanceRepositoryError ||
          err instanceof MaintenanceItemCatalogRepositoryError ||
          err instanceof MaintenanceImageRepositoryError
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

  async function handleDeleteExistingImage(imageId: string) {
    await deleteImage(imageId)
    setImages((prev) => prev.filter((image) => image.id !== imageId))
  }

  async function handleSubmit(values: MaintenanceFormValues) {
    if (!record) return
    setSubmitError(null)

    const { newImageFiles, ...recordValues } = values
    let updatedRecord: MaintenanceRecord
    try {
      updatedRecord = await updateMaintenance({ ...record, ...recordValues })
    } catch (err) {
      setSubmitError(
        err instanceof MaintenanceRepositoryError ? err.message : 'Could not update this maintenance record.',
      )
      throw err
    }

    const failedFilenames: string[] = []
    for (const file of newImageFiles) {
      try {
        const processed = await processImageFile(file)
        await addImage({
          maintenanceId: updatedRecord.id,
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
        `Changes saved, but ${failedFilenames.length} photo(s) could not be saved: ${failedFilenames.join(', ')}. You can try adding them again.`,
      )
      return
    }

    navigate(`/vehicles/${updatedRecord.vehicleId}`, { replace: true })
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
        existingImages={images}
        onDeleteExistingImage={handleDeleteExistingImage}
      />
    </div>
  )
}
