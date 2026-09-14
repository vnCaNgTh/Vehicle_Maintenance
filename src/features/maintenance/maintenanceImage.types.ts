/**
 * A single photo/receipt attachment stored locally for a maintenance
 * record. The image bytes live in IndexedDB as a Blob - nothing is ever
 * uploaded anywhere. Intentionally excluded from backup/restore (M5).
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
