/**
 * A single photo/receipt attachment stored locally for a maintenance
 * record. The image bytes live in IndexedDB as a Blob - nothing is ever
 * uploaded anywhere. Included in the M5 local ZIP backup/restore.
 */
export interface MaintenanceImage {
  id: string
  maintenanceId: string
  blob: Blob
  filename: string
  mimeType: string
  size: number
  createdAt: string
}
