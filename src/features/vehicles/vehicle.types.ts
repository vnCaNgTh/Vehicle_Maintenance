export interface Vehicle {
  id: string
  ownerName: string
  vehicleType: string
  licensePlate: string
  frameNumber: string
  engineNumber: string
  currentOdometer: number
  createdAt: string
  updatedAt: string
}

/**
 * Fields a user can submit through the form. Id/timestamps are assigned by
 * the repository layer.
 */
export interface VehicleFormInput {
  ownerName: string
  vehicleType: string
  licensePlate: string
  frameNumber: string
  engineNumber: string
  currentOdometer: number | string
}
