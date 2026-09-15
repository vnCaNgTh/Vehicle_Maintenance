import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../../components/common/EmptyState'
import { LoadingState } from '../../../components/common/LoadingState'
import { getAllVehicles, VehicleRepositoryError } from '../vehicle.repository'
import type { Vehicle } from '../vehicle.types'
import { VehicleCard } from '../components/VehicleCard'
import styles from './VehiclesPage.module.css'

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getAllVehicles()
      .then((result) => {
        if (cancelled) return
        setVehicles(result)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof VehicleRepositoryError ? err.message : 'Could not load vehicles.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Vehicles</h1>
        <Link to="/vehicles/new" className={styles.addButton}>
          + Add vehicle
        </Link>
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {vehicles === null && !error && <LoadingState label="Loading vehicles…" />}

      {vehicles !== null && vehicles.length === 0 && (
        <EmptyState
          title="No vehicles yet"
          message="Add your first vehicle to start tracking it."
          action={
            <Link to="/vehicles/new" className={styles.addButton}>
              Add vehicle
            </Link>
          }
        />
      )}

      {vehicles !== null && vehicles.length > 0 && (
        <ul className={styles.list}>
          {vehicles.map((vehicle) => (
            <li key={vehicle.id}>
              <VehicleCard vehicle={vehicle} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
