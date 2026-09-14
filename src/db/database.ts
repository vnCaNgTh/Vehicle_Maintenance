import Dexie, { type Table } from 'dexie'
import type { Vehicle } from '../features/vehicles/vehicle.types'
import type { MaintenanceRecord } from '../features/maintenance/maintenance.types'
import { applyMigrations } from './migrations'

/**
 * Single Dexie database for the app. New feature tables (attachments,
 * backup) should be added via migrations.ts, not here.
 */
class MotorcycleCareDatabase extends Dexie {
  vehicles!: Table<Vehicle, string>
  maintenanceRecords!: Table<MaintenanceRecord, string>

  constructor() {
    super('motorcycleCare')
    applyMigrations(this)
  }
}

export const db = new MotorcycleCareDatabase()
