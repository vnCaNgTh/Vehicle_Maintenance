import type { MaintenanceImage } from '../maintenance/maintenanceImage.types'
import { readAllTablesForBackup, replaceAllTablesWithBackup } from './backup.repository'
import { buildBackupFilename, buildBackupZip, parseBackupZip } from './backup.serializer'
import { validateBackupArchive } from './backup.validation'
import type { BackupSummary, ParsedBackupArchive } from './backup.types'

const LAST_BACKUP_AT_KEY = 'motorcycleCare:lastBackupAt'

export interface BackupFile {
  blob: Blob
  filename: string
}

/** Collects all local data and serializes it into a downloadable ZIP backup. */
export async function createBackupFile(): Promise<BackupFile> {
  const tables = await readAllTablesForBackup()
  const blob = await buildBackupZip(tables, __APP_VERSION__)
  return { blob, filename: buildBackupFilename() }
}

/** Triggers a normal browser file download for the given backup - no network request. */
export function downloadBackupFile({ blob, filename }: BackupFile): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  // Delay revoke so every browser has a chance to start the download first.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function getLastBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_AT_KEY)
  } catch {
    return null
  }
}

function setLastBackupAt(isoDate: string): void {
  try {
    localStorage.setItem(LAST_BACKUP_AT_KEY, isoDate)
  } catch {
    // Non-critical: last-backup display is a convenience, not a data path.
  }
}

/** Full "Backup Now" flow: collect data, build the ZIP, download it, and remember when. */
export async function performBackup(): Promise<BackupFile> {
  const file = await createBackupFile()
  downloadBackupFile(file)
  setLastBackupAt(new Date().toISOString())
  return file
}

export interface LoadedBackup {
  archive: ParsedBackupArchive
  summary: BackupSummary
}

/** Thrown when an archive opens/parses fine but fails validation checks. */
export class BackupValidationError extends Error {
  errors: string[]

  constructor(errors: string[]) {
    super(errors[0] ?? 'This backup file could not be validated.')
    this.name = 'BackupValidationError'
    this.errors = errors
  }
}

/** Reads and fully validates a backup file. Never touches IndexedDB. */
export async function loadAndValidateBackupFile(file: File): Promise<LoadedBackup> {
  const archive = await parseBackupZip(file)
  const result = validateBackupArchive(archive)
  if (!result.isValid) {
    throw new BackupValidationError(result.errors)
  }

  return {
    archive,
    summary: {
      createdAt: archive.manifest.createdAt,
      appVersion: archive.manifest.appVersion,
      databaseVersion: archive.manifest.databaseVersion,
      counts: archive.manifest.counts,
    },
  }
}

/**
 * Restores a previously validated archive as the new local dataset, in one
 * atomic Dexie transaction (see backup.repository.replaceAllTablesWithBackup).
 */
export async function restoreFromBackup(archive: ParsedBackupArchive): Promise<void> {
  const maintenanceImages: MaintenanceImage[] = archive.imageEntries.map((entry) => {
    const blob = archive.imageBlobs.get(entry.id)
    if (!blob) {
      // Already checked by validateBackupArchive; guarded again so a
      // restore can never create an image record with no bytes behind it.
      throw new BackupValidationError([`Photo "${entry.filename}" is missing its image data.`])
    }
    return {
      id: entry.id,
      maintenanceId: entry.maintenanceId,
      blob,
      filename: entry.filename,
      mimeType: entry.mimeType,
      size: entry.size,
      createdAt: entry.createdAt,
    }
  })

  await replaceAllTablesWithBackup({
    vehicles: archive.vehicles,
    maintenanceRecords: archive.maintenanceRecords,
    maintenanceItemDefinitions: archive.maintenanceItemDefinitions,
    maintenanceImages,
  })
}
