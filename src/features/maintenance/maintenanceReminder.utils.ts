import type { MaintenanceRecord } from './maintenance.types'

/** Next-due reminder for one maintenance item, derived from its latest snapshot. */
export interface NextMaintenanceReminder {
  itemId: string
  name: string
  nextOdo: number
}

/** "Latest" = highest odometer, falling back to the app's date/createdAt ordering on ties. */
function compareByRecency(a: MaintenanceRecord, b: MaintenanceRecord): number {
  if (b.odometer !== a.odometer) return b.odometer - a.odometer
  const dateCompare = b.maintenanceDate.localeCompare(a.maintenanceDate)
  return dateCompare !== 0 ? dateCompare : b.createdAt.localeCompare(a.createdAt)
}

/**
 * For each maintenance item that has ever had reminders enabled, finds the
 * latest record that actually contains it (not just the vehicle's latest
 * record overall) and reads that snapshot's `nextOdo`.
 */
export function getNextMaintenanceReminders(records: MaintenanceRecord[]): NextMaintenanceReminder[] {
  const latestByItem = new Map<string, NextMaintenanceReminder>()

  for (const record of [...records].sort(compareByRecency)) {
    for (const item of record.items) {
      if (!item.reminderEnabled || item.nextOdo === undefined || latestByItem.has(item.itemId)) {
        continue
      }
      latestByItem.set(item.itemId, { itemId: item.itemId, name: item.name, nextOdo: item.nextOdo })
    }
  }

  return Array.from(latestByItem.values())
}
