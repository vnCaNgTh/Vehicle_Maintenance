import type { MaintenanceRecordItem } from './maintenanceItem.types'

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  maintenanceDate: string
  odometer: number
  /** Optional free-text note. Structured items are the primary content. */
  description?: string
  cost: number
  items: MaintenanceRecordItem[]
  createdAt: string
  updatedAt: string
}

/**
 * Fields a user can submit through the form. Id/vehicleId/timestamps are
 * assigned by the route/repository layer, not typed by the user.
 */
export interface MaintenanceFormInput {
  maintenanceDate: string
  odometer: number | string
  description: string
  cost: number | string
}
