import { db } from '../../db/database'
import type { Vehicle } from './vehicle.types'

/**
 * Thrown by repository functions so UI code can show a friendly message
 * instead of a raw Dexie/IndexedDB error.
 */
export class VehicleRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'VehicleRepositoryError'
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

export async function getAllVehicles(): Promise<Vehicle[]> {
  try {
    const vehicles = await db.vehicles.toArray()
    return vehicles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  } catch (error) {
    throw new VehicleRepositoryError('Could not load vehicles from this device.', error)
  }
}

export async function getVehicleById(id: string): Promise<Vehicle | undefined> {
  try {
    return await db.vehicles.get(id)
  } catch (error) {
    throw new VehicleRepositoryError('Could not load this vehicle from this device.', error)
  }
}

export async function createVehicle(
  vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Vehicle> {
  const now = new Date().toISOString()
  const newVehicle: Vehicle = {
    ...vehicle,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  try {
    await db.vehicles.add(newVehicle)
    return newVehicle
  } catch (error) {
    throw new VehicleRepositoryError('Could not save this vehicle.', error)
  }
}

export async function updateVehicle(vehicle: Vehicle): Promise<Vehicle> {
  const updatedVehicle: Vehicle = {
    ...vehicle,
    updatedAt: new Date().toISOString(),
  }

  try {
    await db.vehicles.put(updatedVehicle)
    return updatedVehicle
  } catch (error) {
    throw new VehicleRepositoryError('Could not update this vehicle.', error)
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  try {
    // Isolated so a future cascade-delete of maintenance records/attachments
    // can be added here without changing callers.
    await db.vehicles.delete(id)
  } catch (error) {
    throw new VehicleRepositoryError('Could not delete this vehicle.', error)
  }
}
