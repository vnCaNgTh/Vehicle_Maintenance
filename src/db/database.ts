import Dexie, { type Table } from 'dexie'
import type { Vehicle } from '../features/vehicles/vehicle.types'
import { applyMigrations } from './migrations'

/**
 * Single Dexie database for the app. New feature tables (maintenance,
 * attachments, backup) should be added via migrations.ts, not here.
 */
class MotorcycleCareDatabase extends Dexie {
  vehicles!: Table<Vehicle, string>

  constructor() {
    super('motorcycleCare')
    applyMigrations(this)
  }
}

export const db = new MotorcycleCareDatabase()
