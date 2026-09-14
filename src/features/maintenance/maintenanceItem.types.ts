/**
 * Reusable checklist entry. System items use stable fixed ids; custom items
 * get a generated id when the user saves them to the default checklist.
 */
export interface MaintenanceItemDefinition {
  id: string
  name: string
  reminderEnabled: boolean
  intervalKm?: number
  isCustom: boolean
}

/**
 * Snapshot of a checklist item as selected on a specific maintenance record.
 * Intentionally decoupled from MaintenanceItemDefinition: if the catalog
 * definition changes later (e.g. interval edited), existing records keep
 * showing the values that were true at the time they were saved.
 */
export interface MaintenanceRecordItem {
  itemId: string
  name: string
  reminderEnabled: boolean
  intervalKm?: number
  nextOdo?: number
}
