import { Link } from 'react-router-dom'
import type { Vehicle } from '../vehicle.types'
import styles from './VehicleCard.module.css'

interface VehicleCardProps {
  vehicle: Vehicle
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Link to={`/vehicles/${vehicle.id}`} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.type}>{vehicle.vehicleType}</span>
        <span className={styles.plate}>{vehicle.licensePlate}</span>
      </div>
      <div className={styles.details}>
        <span>{vehicle.ownerName}</span>
        <span>{vehicle.currentOdometer.toLocaleString()} km</span>
      </div>
    </Link>
  )
}
