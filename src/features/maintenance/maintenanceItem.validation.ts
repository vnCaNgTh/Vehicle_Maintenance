export interface CustomMaintenanceItemFormInput {
  name: string
  reminderEnabled: boolean
  intervalKm: number | string
}

export interface CustomMaintenanceItemValidationErrors {
  name?: string
  intervalKm?: string
}

export interface CustomMaintenanceItemValidationResult {
  isValid: boolean
  errors: CustomMaintenanceItemValidationErrors
  values: {
    name: string
    reminderEnabled: boolean
    intervalKm?: number
  }
}

/**
 * Validates a custom checklist item. intervalKm is only required (and must
 * be positive) when reminderEnabled is true.
 */
export function validateCustomMaintenanceItemForm(
  input: CustomMaintenanceItemFormInput,
): CustomMaintenanceItemValidationResult {
  const name = input.name.trim()
  const errors: CustomMaintenanceItemValidationErrors = {}

  if (!name) {
    errors.name = 'Item name is required.'
  }

  let intervalKm: number | undefined
  if (input.reminderEnabled) {
    if (input.intervalKm === '' || input.intervalKm === null || input.intervalKm === undefined) {
      errors.intervalKm = 'Interval is required when a reminder is enabled.'
    } else {
      const intervalNumber = typeof input.intervalKm === 'number' ? input.intervalKm : Number(input.intervalKm)
      if (Number.isNaN(intervalNumber) || intervalNumber <= 0) {
        errors.intervalKm = 'Interval must be a positive number.'
      } else {
        intervalKm = intervalNumber
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: { name, reminderEnabled: input.reminderEnabled, intervalKm },
  }
}
