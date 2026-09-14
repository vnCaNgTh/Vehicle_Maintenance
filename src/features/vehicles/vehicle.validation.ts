import type { VehicleFormInput } from './vehicle.types'

export interface VehicleValidationErrors {
  ownerName?: string
  vehicleType?: string
  licensePlate?: string
  currentOdometer?: string
}

export interface VehicleValidationResult {
  isValid: boolean
  errors: VehicleValidationErrors
  /** Trimmed values, ready to persist when isValid is true. */
  values: {
    ownerName: string
    vehicleType: string
    licensePlate: string
    frameNumber: string
    engineNumber: string
    currentOdometer: number
  }
}

/**
 * Validates and normalizes vehicle form input.
 * Intentionally does NOT enforce a strict license plate format, since
 * real-world plates vary in spacing/formatting.
 */
export function validateVehicleForm(input: VehicleFormInput): VehicleValidationResult {
  const ownerName = input.ownerName.trim()
  const vehicleType = input.vehicleType.trim()
  const licensePlate = input.licensePlate.trim()
  const frameNumber = input.frameNumber.trim()
  const engineNumber = input.engineNumber.trim()

  const odometerNumber =
    typeof input.currentOdometer === 'number' ? input.currentOdometer : Number(input.currentOdometer)

  const errors: VehicleValidationErrors = {}

  if (!ownerName) {
    errors.ownerName = 'Owner name is required.'
  }

  if (!vehicleType) {
    errors.vehicleType = 'Vehicle type is required.'
  }

  if (!licensePlate) {
    errors.licensePlate = 'License plate is required.'
  }

  if (input.currentOdometer === '' || input.currentOdometer === null || input.currentOdometer === undefined) {
    errors.currentOdometer = 'Current odometer is required.'
  } else if (Number.isNaN(odometerNumber)) {
    errors.currentOdometer = 'Current odometer must be a number.'
  } else if (odometerNumber < 0) {
    errors.currentOdometer = 'Current odometer must be 0 or greater.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: {
      ownerName,
      vehicleType,
      licensePlate,
      frameNumber,
      engineNumber,
      currentOdometer: Number.isNaN(odometerNumber) ? 0 : odometerNumber,
    },
  }
}
