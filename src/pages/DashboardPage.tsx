import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { VehicleCard } from '../features/vehicles/components/VehicleCard'
import { getAllVehicles, VehicleRepositoryError } from '../features/vehicles/vehicle.repository'
import type { Vehicle } from '../features/vehicles/vehicle.types'
import styles from './DashboardPage.module.css'

const RECENT_VEHICLES_LIMIT = 5

export function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAllVehicles()
      .then(setVehicles)
      .catch((err) => {
        setError(err instanceof VehicleRepositoryError ? err.message : 'Could not load vehicles.')
        setVehicles([])
      })
  }, [])

  if (vehicles === null && !error) {
    return <LoadingState label="Loading dashboard…" />
  }

  const list = vehicles ?? []

  return (
    <div className={styles.page}>
      <h1>Dashboard</h1>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {list.length === 0 ? (
        <EmptyState
          title="No vehicles yet"
          message="Add your first vehicle to start tracking it."
          action={
            <Link to="/vehicles/new" className={styles.addButton}>
              Add vehicle
            </Link>
          }
        />
      ) : (
        <>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{list.length}</span>
            <span className={styles.summaryLabel}>{list.length === 1 ? 'Vehicle' : 'Vehicles'}</span>
          </div>

          <div className={styles.recentHeader}>
            <h2>Recently updated</h2>
            <Link to="/vehicles">See all</Link>
          </div>
          <ul className={styles.list}>
            {list.slice(0, RECENT_VEHICLES_LIMIT).map((vehicle) => (
              <li key={vehicle.id}>
                <VehicleCard vehicle={vehicle} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
