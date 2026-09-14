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

  // v2 (M2): add maintenance records. The vehicles store/indexes are
  // unchanged, so existing vehicle data is preserved automatically.
  db.version(2).stores({
    vehicles: 'id, updatedAt',
    maintenanceRecords: 'id, vehicleId, maintenanceDate, updatedAt',
  })

  // v3 (M3): add the maintenance item checklist/catalog. vehicles and
  // maintenanceRecords index strings are unchanged, so existing data in
  // those stores is left untouched. The new `items` array on
  // MaintenanceRecord is not indexed, so it needs no store change here -
  // old records simply lack the field and are normalized when read.
  db.version(3).stores({
    vehicles: 'id, updatedAt',
    maintenanceRecords: 'id, vehicleId, maintenanceDate, updatedAt',
    maintenanceItemDefinitions: 'id, isCustom',
  })
}
