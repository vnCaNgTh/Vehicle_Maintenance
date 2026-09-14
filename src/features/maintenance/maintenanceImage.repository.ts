import { db } from '../../db/database'
import type { MaintenanceImage } from './maintenanceImage.types'

/**
 * Thrown by repository functions so UI code can show a friendly message
 * instead of a raw Dexie/IndexedDB error.
 */
export class MaintenanceImageRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'MaintenanceImageRepositoryError'
    this.cause = cause
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function getImagesByMaintenanceId(maintenanceId: string): Promise<MaintenanceImage[]> {
  try {
    const images = await db.maintenanceImages.where('maintenanceId').equals(maintenanceId).toArray()
    return images.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  } catch (error) {
    throw new MaintenanceImageRepositoryError('Could not load photos for this maintenance record.', error)
  }
}

export async function getImageById(id: string): Promise<MaintenanceImage | undefined> {
  try {
    return await db.maintenanceImages.get(id)
  } catch (error) {
    throw new MaintenanceImageRepositoryError('Could not load this photo.', error)
  }
}

export async function addImage(input: Omit<MaintenanceImage, 'id' | 'createdAt'>): Promise<MaintenanceImage> {
  const image: MaintenanceImage = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }

  try {
    await db.maintenanceImages.add(image)
    return image
  } catch (error) {
    throw new MaintenanceImageRepositoryError('Could not save this photo.', error)
  }
}

export async function deleteImage(id: string): Promise<void> {
  try {
    await db.maintenanceImages.delete(id)
  } catch (error) {
    throw new MaintenanceImageRepositoryError('Could not delete this photo.', error)
  }
}

export async function deleteImagesByMaintenanceId(maintenanceId: string): Promise<void> {
  try {
    await db.maintenanceImages.where('maintenanceId').equals(maintenanceId).delete()
  } catch (error) {
    throw new MaintenanceImageRepositoryError('Could not delete photos for this maintenance record.', error)
  }
}
