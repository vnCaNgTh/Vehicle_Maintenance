import { BACKUP_FORMAT, SUPPORTED_BACKUP_FORMAT_VERSIONS, type ParsedBackupArchive } from './backup.types'

export interface BackupValidationResult {
  isValid: boolean
  errors: string[]
}

function findDuplicateIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id)
    }
    seen.add(id)
  }
  return [...duplicates]
}

/**
 * Validates a structurally-parsed backup archive before any IndexedDB data
 * is touched. Checks format/version, id well-formedness and uniqueness,
 * cross-dataset references, and that every image's binary data is present.
 */
export function validateBackupArchive(archive: ParsedBackupArchive): BackupValidationResult {
  const errors: string[] = []
  const { manifest, vehicles, maintenanceRecords, maintenanceItemDefinitions, imageEntries, imageBlobs } = archive

  if (manifest.format !== BACKUP_FORMAT) {
    errors.push('This file is not a Vehicles Care backup.')
  }
  if (!SUPPORTED_BACKUP_FORMAT_VERSIONS.includes(manifest.formatVersion)) {
    errors.push(`This backup format (version ${manifest.formatVersion}) is not supported by this version of the app.`)
  }

  // Stop early: once the format itself is unrecognized, the rest of the
  // checks below can't be trusted to mean anything useful.
  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  const idGroups: Array<{ label: string; ids: string[] }> = [
    { label: 'vehicle', ids: vehicles.map((item) => item.id) },
    { label: 'maintenance record', ids: maintenanceRecords.map((item) => item.id) },
    { label: 'catalog item', ids: maintenanceItemDefinitions.map((item) => item.id) },
    { label: 'photo', ids: imageEntries.map((item) => item.id) },
  ]

  for (const group of idGroups) {
    if (group.ids.some((id) => typeof id !== 'string' || id.length === 0)) {
      errors.push(`One or more ${group.label} entries has an invalid id.`)
    }
    const duplicates = findDuplicateIds(group.ids)
    if (duplicates.length > 0) {
      errors.push(`Duplicate ${group.label} id(s) found in backup: ${duplicates.join(', ')}`)
    }
  }

  const vehicleIds = new Set(vehicles.map((vehicle) => vehicle.id))
  for (const record of maintenanceRecords) {
    if (!vehicleIds.has(record.vehicleId)) {
      errors.push(`Maintenance record ${record.id} references a vehicle that does not exist in this backup.`)
    }
  }

  const maintenanceIds = new Set(maintenanceRecords.map((record) => record.id))
  for (const entry of imageEntries) {
    if (!maintenanceIds.has(entry.maintenanceId)) {
      errors.push(`Photo "${entry.filename}" references a maintenance record that does not exist in this backup.`)
    }
    if (!imageBlobs.has(entry.id)) {
      errors.push(`Photo "${entry.filename}" is missing its image data in the backup archive.`)
    }
  }

  return { isValid: errors.length === 0, errors }
}
