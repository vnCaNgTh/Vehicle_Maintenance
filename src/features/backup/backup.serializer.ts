import JSZip from 'jszip'
import type { Vehicle } from '../vehicles/vehicle.types'
import type { MaintenanceRecord } from '../maintenance/maintenance.types'
import type { MaintenanceItemDefinition } from '../maintenance/maintenanceItem.types'
import type { RawBackupTables } from './backup.repository'
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  BackupArchiveError,
  type BackupImageEntry,
  type BackupManifest,
  type ParsedBackupArchive,
} from './backup.types'

const DATABASE_VERSION = 4

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/jpeg':
    default:
      return 'jpg'
  }
}

/** Builds a sortable, collision-resistant backup filename with a local timestamp. */
export function buildBackupFilename(date = new Date()): string {
  const pad = (value: number) => value.toString().padStart(2, '0')
  const stamp =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `motorcycle-care-backup-${stamp}.zip`
}

export async function buildBackupZip(tables: RawBackupTables, appVersion: string): Promise<Blob> {
  const zip = new JSZip()

  const imageEntries: BackupImageEntry[] = tables.maintenanceImages.map((image) => ({
    id: image.id,
    maintenanceId: image.maintenanceId,
    filename: image.filename,
    mimeType: image.mimeType,
    size: image.size,
    createdAt: image.createdAt,
    path: `images/${image.id}.${extensionForMimeType(image.mimeType)}`,
  }))

  const manifest: BackupManifest = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion,
    databaseVersion: DATABASE_VERSION,
    createdAt: new Date().toISOString(),
    counts: {
      vehicles: tables.vehicles.length,
      maintenanceRecords: tables.maintenanceRecords.length,
      maintenanceItemDefinitions: tables.maintenanceItemDefinitions.length,
      maintenanceImages: tables.maintenanceImages.length,
    },
  }

  zip.file('manifest.json', JSON.stringify(manifest, null, 2))
  zip.file('vehicles.json', JSON.stringify(tables.vehicles, null, 2))
  zip.file('maintenance-records.json', JSON.stringify(tables.maintenanceRecords, null, 2))
  zip.file('catalog.json', JSON.stringify(tables.maintenanceItemDefinitions, null, 2))
  zip.file('maintenance-images.json', JSON.stringify(imageEntries, null, 2))

  tables.maintenanceImages.forEach((image, index) => {
    zip.file(imageEntries[index].path, image.blob)
  })

  return zip.generateAsync({ type: 'blob' })
}

async function readJsonEntry<T>(zip: JSZip, path: string): Promise<T> {
  const entry = zip.file(path)
  if (!entry) {
    throw new BackupArchiveError(`This backup is missing a required file: ${path}`)
  }

  const text = await entry.async('string')
  try {
    return JSON.parse(text) as T
  } catch (error) {
    throw new BackupArchiveError(`This backup file is corrupted (invalid JSON): ${path}`, error)
  }
}

async function readJsonArrayEntry<T>(zip: JSZip, path: string): Promise<T[]> {
  const data = await readJsonEntry<unknown>(zip, path)
  if (!Array.isArray(data)) {
    throw new BackupArchiveError(`This backup file is corrupted (expected a list): ${path}`)
  }
  return data as T[]
}

/**
 * Structurally parses a backup ZIP: opens the archive, reads and JSON-parses
 * every required file, and collects available image blobs. Throws
 * BackupArchiveError for anything that makes the archive fundamentally
 * unusable (bad ZIP, missing file, corrupt JSON). Deeper checks - format
 * version, duplicate/invalid ids, dangling references, missing image bytes -
 * are the responsibility of backup.validation.ts, run on the result.
 */
export async function parseBackupZip(file: Blob): Promise<ParsedBackupArchive> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(file)
  } catch (error) {
    throw new BackupArchiveError('This file is not a valid backup archive (could not open ZIP).', error)
  }

  const manifest = await readJsonEntry<unknown>(zip, 'manifest.json')
  if (typeof manifest !== 'object' || manifest === null) {
    throw new BackupArchiveError('This backup is missing a valid manifest.json.')
  }

  const vehicles = await readJsonArrayEntry<Vehicle>(zip, 'vehicles.json')
  const maintenanceRecords = await readJsonArrayEntry<MaintenanceRecord>(zip, 'maintenance-records.json')
  const maintenanceItemDefinitions = await readJsonArrayEntry<MaintenanceItemDefinition>(zip, 'catalog.json')
  const imageEntries = await readJsonArrayEntry<BackupImageEntry>(zip, 'maintenance-images.json')

  const imageBlobs = new Map<string, Blob>()
  for (const entry of imageEntries) {
    const zipEntry = zip.file(entry.path)
    if (zipEntry) {
      imageBlobs.set(entry.id, await zipEntry.async('blob'))
    }
  }

  return {
    manifest: manifest as BackupManifest,
    vehicles,
    maintenanceRecords,
    maintenanceItemDefinitions,
    imageEntries,
    imageBlobs,
  }
}
