import type { Vehicle } from '../vehicles/vehicle.types'
import type { MaintenanceRecord } from '../maintenance/maintenance.types'
import type { MaintenanceItemDefinition } from '../maintenance/maintenanceItem.types'

export const BACKUP_FORMAT = 'vehicles-care-backup' as const
export const BACKUP_FORMAT_VERSION = 1
export const SUPPORTED_BACKUP_FORMAT_VERSIONS: readonly number[] = [1]

export interface BackupManifest {
  format: typeof BACKUP_FORMAT
  formatVersion: number
  appVersion: string
  databaseVersion: number
  createdAt: string
  counts: {
    vehicles: number
    maintenanceRecords: number
    maintenanceItemDefinitions: number
    maintenanceImages: number
  }
}

/** Image metadata as stored in maintenance-images.json; blob bytes live under images/. */
export interface BackupImageEntry {
  id: string
  maintenanceId: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
  path: string
}

/** Fully parsed contents of a backup archive, ready for validation and restore. */
export interface ParsedBackupArchive {
  manifest: BackupManifest
  vehicles: Vehicle[]
  maintenanceRecords: MaintenanceRecord[]
  maintenanceItemDefinitions: MaintenanceItemDefinition[]
  imageEntries: BackupImageEntry[]
  imageBlobs: Map<string, Blob>
}

/** Small summary shown to the user before they confirm a restore. */
export interface BackupSummary {
  createdAt: string
  appVersion: string
  databaseVersion: number
  counts: BackupManifest['counts']
}

/** Thrown when a file cannot even be read as a backup archive (bad ZIP, missing/corrupt JSON). */
export class BackupArchiveError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'BackupArchiveError'
    this.cause = cause
  }
}
