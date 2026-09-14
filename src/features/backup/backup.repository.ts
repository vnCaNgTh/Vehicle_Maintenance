import { db } from '../../db/database'
import type { Vehicle } from '../vehicles/vehicle.types'
import type { MaintenanceRecord } from '../maintenance/maintenance.types'
import type { MaintenanceItemDefinition } from '../maintenance/maintenanceItem.types'
import type { MaintenanceImage } from '../maintenance/maintenanceImage.types'

/**
 * Thrown by backup repository functions so UI code can show a friendly
 * message instead of a raw Dexie/IndexedDB error.
 */
export class BackupRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'BackupRepositoryError'
    this.cause = cause
  }
}

export interface RawBackupTables {
  vehicles: Vehicle[]
  maintenanceRecords: MaintenanceRecord[]
  maintenanceItemDefinitions: MaintenanceItemDefinition[]
  maintenanceImages: MaintenanceImage[]
}

/** Reads every row of every current Dexie table (v4), unmodified, for backup. */
export async function readAllTablesForBackup(): Promise<RawBackupTables> {
  try {
    const [vehicles, maintenanceRecords, maintenanceItemDefinitions, maintenanceImages] = await Promise.all([
      db.vehicles.toArray(),
      db.maintenanceRecords.toArray(),
      db.maintenanceItemDefinitions.toArray(),
      db.maintenanceImages.toArray(),
    ])
    return { vehicles, maintenanceRecords, maintenanceItemDefinitions, maintenanceImages }
  } catch (error) {
    throw new BackupRepositoryError('Could not read local data for backup.', error)
  }
}

/**
 * Replaces every current Dexie table with the given data in a single
 * transaction. If any step fails, Dexie rolls back the whole transaction so
 * the existing data is left completely untouched.
 */
export async function replaceAllTablesWithBackup(tables: RawBackupTables): Promise<void> {
  try {
    await db.transaction(
      'rw',
      db.vehicles,
      db.maintenanceRecords,
      db.maintenanceItemDefinitions,
      db.maintenanceImages,
      async () => {
        await Promise.all([
          db.vehicles.clear(),
          db.maintenanceRecords.clear(),
          db.maintenanceItemDefinitions.clear(),
          db.maintenanceImages.clear(),
        ])
        await Promise.all([
          db.vehicles.bulkAdd(tables.vehicles),
          db.maintenanceRecords.bulkAdd(tables.maintenanceRecords),
          db.maintenanceItemDefinitions.bulkAdd(tables.maintenanceItemDefinitions),
          db.maintenanceImages.bulkAdd(tables.maintenanceImages),
        ])
      },
    )
  } catch (error) {
    throw new BackupRepositoryError('Could not restore this backup. Your existing data was not modified.', error)
  }
}
