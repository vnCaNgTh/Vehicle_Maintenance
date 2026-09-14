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

// Fixed ids so historical records keep referencing the same system item even
// as the catalog evolves. Do not reuse these ids for custom items.
const DEFAULT_CATALOG_ITEMS: MaintenanceItemDefinition[] = [
  { id: 'system-full-service', name: 'Bảo dưỡng toàn phần', reminderEnabled: false, isCustom: false },
  { id: 'system-engine-oil', name: 'Thay nhớt máy', reminderEnabled: true, intervalKm: 2000, isCustom: false },
  { id: 'system-gearbox-oil', name: 'Thay nhớt hộp số', reminderEnabled: true, intervalKm: 6000, isCustom: false },
  { id: 'system-general-check', name: 'Kiểm tra tổng quát', reminderEnabled: false, isCustom: false },
  { id: 'system-air-filter', name: 'Thay lọc gió', reminderEnabled: false, isCustom: false },
  { id: 'system-spark-plug', name: 'Thay bugi', reminderEnabled: false, isCustom: false },
]

/**
 * Seeds the predefined checklist once. Uses bulkPut (upsert by fixed id)
 * inside a transaction so it is safe to call from every read: fresh
 * installs get seeded, already-seeded databases are left untouched, and a
 * rare concurrent double-call cannot create duplicates. Dexie upgrade()
 * callbacks never run for brand-new databases, so seeding cannot live there.
 */
async function seedDefaultCatalogIfEmpty(): Promise<void> {
  await db.transaction('rw', db.maintenanceItemDefinitions, async () => {
    const count = await db.maintenanceItemDefinitions.count()
    if (count === 0) {
      await db.maintenanceItemDefinitions.bulkPut(DEFAULT_CATALOG_ITEMS)
    }
  })
}

export async function getMaintenanceItemCatalog(): Promise<MaintenanceItemDefinition[]> {
  try {
    await seedDefaultCatalogIfEmpty()
    const items = await db.maintenanceItemDefinitions.toArray()
    return items.sort((a, b) => {
      if (a.isCustom !== b.isCustom) {
        return a.isCustom ? 1 : -1
      }
      return a.name.localeCompare(b.name)
    })
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
