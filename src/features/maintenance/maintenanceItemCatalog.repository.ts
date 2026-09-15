import { db } from '../../db/database'
import type { MaintenanceItemDefinition } from './maintenanceItem.types'

/**
 * Thrown by repository functions so UI code can show a friendly message
 * instead of a raw Dexie/IndexedDB error.
 */
export class MaintenanceItemCatalogRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'MaintenanceItemCatalogRepositoryError'
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

/** The user manages the entire catalog themselves; there are no built-in defaults. */
export async function getMaintenanceItemCatalog(): Promise<MaintenanceItemDefinition[]> {
  try {
    const items = await db.maintenanceItemDefinitions.toArray()
    return items.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    throw new MaintenanceItemCatalogRepositoryError('Could not load the maintenance checklist.', error)
  }
}

export async function addCustomMaintenanceItemToCatalog(input: {
  name: string
  reminderEnabled: boolean
  intervalKm?: number
}): Promise<MaintenanceItemDefinition> {
  const item: MaintenanceItemDefinition = {
    id: generateId(),
    name: input.name,
    reminderEnabled: input.reminderEnabled,
    intervalKm: input.reminderEnabled ? input.intervalKm : undefined,
    isCustom: true,
  }

  try {
    await db.maintenanceItemDefinitions.add(item)
    return item
  } catch (error) {
    throw new MaintenanceItemCatalogRepositoryError('Could not save this item to the checklist.', error)
  }
}

export async function updateMaintenanceItemInCatalog(
  id: string,
  input: { name: string; reminderEnabled: boolean; intervalKm?: number },
): Promise<MaintenanceItemDefinition> {
  try {
    const existing = await db.maintenanceItemDefinitions.get(id)
    if (!existing) {
      throw new MaintenanceItemCatalogRepositoryError('This maintenance item no longer exists on this device.')
    }
    const updated: MaintenanceItemDefinition = {
      ...existing,
      name: input.name,
      reminderEnabled: input.reminderEnabled,
      intervalKm: input.reminderEnabled ? input.intervalKm : undefined,
    }
    await db.maintenanceItemDefinitions.put(updated)
    return updated
  } catch (error) {
    if (error instanceof MaintenanceItemCatalogRepositoryError) {
      throw error
    }
    throw new MaintenanceItemCatalogRepositoryError('Could not update this maintenance item.', error)
  }
}

/**
 * Deletes a catalog item. Existing maintenance records are unaffected: each
 * MaintenanceRecordItem is an independent snapshot (name/reminder/interval)
 * taken at save time, not a live reference to this table.
 */
export async function deleteMaintenanceItemFromCatalog(id: string): Promise<void> {
  try {
    await db.maintenanceItemDefinitions.delete(id)
  } catch (error) {
    throw new MaintenanceItemCatalogRepositoryError('Could not delete this maintenance item.', error)
  }
}
