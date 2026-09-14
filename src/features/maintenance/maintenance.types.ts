export interface MaintenanceRecord {
  id: string
  vehicleId: string
  maintenanceDate: string
  odometer: number
  description: string
  cost: number
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
