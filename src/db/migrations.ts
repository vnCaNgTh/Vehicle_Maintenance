import type { Dexie } from 'dexie'

/**
 * Central place for Dexie schema versions so future milestones (maintenance
 * records, attachments, backup/restore) can add tables/indexes without
 * touching existing version definitions.
 */
export function applyMigrations(db: Dexie): void {
  // v1 (M1): vehicles only.
  db.version(1).stores({
    vehicles: 'id, updatedAt',
  })

  // Future versions will be appended here, e.g.:
  // db.version(2).stores({
  //   vehicles: 'id, updatedAt',
  //   maintenanceRecords: 'id, vehicleId, updatedAt',
  //   maintenanceImages: 'id, maintenanceRecordId',
  // })
}
