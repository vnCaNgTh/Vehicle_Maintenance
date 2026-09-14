import type { MaintenanceFormInput } from './maintenance.types'

export interface MaintenanceValidationErrors {
  maintenanceDate?: string
  description?: string
  odometer?: string
  cost?: string
}

export interface MaintenanceValidationResult {
  isValid: boolean
  errors: MaintenanceValidationErrors
  /** Trimmed/normalized values, ready to persist when isValid is true. */
  values: {
    maintenanceDate: string
    description: string
    odometer: number
    cost: number
  }
}

/**
 * Validates and normalizes maintenance form input. Description is
 * intentionally free-form (no format restriction) beyond being non-empty.
 */
export function validateMaintenanceForm(input: MaintenanceFormInput): MaintenanceValidationResult {
  const maintenanceDate = input.maintenanceDate.trim()
  const description = input.description.trim()

  const odometerNumber = typeof input.odometer === 'number' ? input.odometer : Number(input.odometer)
  const costNumber = typeof input.cost === 'number' ? input.cost : Number(input.cost)

  const errors: MaintenanceValidationErrors = {}

  if (!maintenanceDate) {
    errors.maintenanceDate = 'Maintenance date is required.'
  }

  if (!description) {
    errors.description = 'Description is required.'
  }

  if (input.odometer === '' || input.odometer === null || input.odometer === undefined) {
    errors.odometer = 'Odometer is required.'
  } else if (Number.isNaN(odometerNumber)) {
    errors.odometer = 'Odometer must be a number.'
  } else if (odometerNumber < 0) {
    errors.odometer = 'Odometer must be 0 or greater.'
  }

  if (input.cost === '' || input.cost === null || input.cost === undefined) {
    errors.cost = 'Cost is required.'
  } else if (Number.isNaN(costNumber)) {
    errors.cost = 'Cost must be a number.'
  } else if (costNumber < 0) {
    errors.cost = 'Cost must be 0 or greater.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: {
      maintenanceDate,
      description,
      odometer: Number.isNaN(odometerNumber) ? 0 : odometerNumber,
      cost: Number.isNaN(costNumber) ? 0 : costNumber,
    },
  }
}
