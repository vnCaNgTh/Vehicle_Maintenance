import { db } from '../../db/database'
import type { MaintenanceRecord } from './maintenance.types'

/**
 * Thrown by repository functions so UI code can show a friendly message
 * instead of a raw Dexie/IndexedDB error.
 */
export class MaintenanceRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'MaintenanceRepositoryError'
    this.cause = cause
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function sortMaintenanceRecords(records: MaintenanceRecord[]): MaintenanceRecord[] {
  return records.sort((a, b) => {
    const dateCompare = b.maintenanceDate.localeCompare(a.maintenanceDate)
    return dateCompare !== 0 ? dateCompare : b.createdAt.localeCompare(a.createdAt)
  })
}

/** Raises the vehicle's current odometer, never lowers it. */
async function bumpVehicleOdometerIfHigher(vehicleId: string, odometer: number): Promise<void> {
  const vehicle = await db.vehicles.get(vehicleId)
  if (vehicle && odometer > vehicle.currentOdometer) {
    await db.vehicles.put({ ...vehicle, currentOdometer: odometer, updatedAt: new Date().toISOString() })
  }
}

export async function getMaintenanceByVehicleId(vehicleId: string): Promise<MaintenanceRecord[]> {
  try {
    const records = await db.maintenanceRecords.where('vehicleId').equals(vehicleId).toArray()
    return sortMaintenanceRecords(records)
  } catch (error) {
    throw new MaintenanceRepositoryError('Could not load maintenance records for this vehicle.', error)
  }
}

export async function getMaintenanceById(id: string): Promise<MaintenanceRecord | undefined> {
  try {
    return await db.maintenanceRecords.get(id)
  } catch (error) {
    throw new MaintenanceRepositoryError('Could not load this maintenance record.', error)
  }
}

export async function createMaintenance(
  input: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<MaintenanceRecord> {
  const now = new Date().toISOString()
  const record: MaintenanceRecord = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  try {
    await db.transaction('rw', db.maintenanceRecords, db.vehicles, async () => {
      const vehicle = await db.vehicles.get(record.vehicleId)
      if (!vehicle) {
        throw new MaintenanceRepositoryError('This vehicle no longer exists on this device.')
      }
      await db.maintenanceRecords.add(record)
      await bumpVehicleOdometerIfHigher(record.vehicleId, record.odometer)
    })
    return record
  } catch (error) {
    if (error instanceof MaintenanceRepositoryError) {
      throw error
    }
    throw new MaintenanceRepositoryError('Could not save this maintenance record.', error)
  }
}

export async function updateMaintenance(record: MaintenanceRecord): Promise<MaintenanceRecord> {
  const updatedRecord: MaintenanceRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
  }

  try {
    await db.transaction('rw', db.maintenanceRecords, db.vehicles, async () => {
      await db.maintenanceRecords.put(updatedRecord)
      await bumpVehicleOdometerIfHigher(updatedRecord.vehicleId, updatedRecord.odometer)
    })
    return updatedRecord
  } catch (error) {
    throw new MaintenanceRepositoryError('Could not update this maintenance record.', error)
  }
}

export async function deleteMaintenance(id: string): Promise<void> {
  try {
    await db.maintenanceRecords.delete(id)
  } catch (error) {
    throw new MaintenanceRepositoryError('Could not delete this maintenance record.', error)
  }
}
