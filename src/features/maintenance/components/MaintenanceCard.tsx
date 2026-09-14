import { Link } from 'react-router-dom'
import type { MaintenanceRecord } from '../maintenance.types'
import { formatCurrency, formatDate } from '../../../shared/format'
import styles from './MaintenanceCard.module.css'

interface MaintenanceCardProps {
  record: MaintenanceRecord
}

export function MaintenanceCard({ record }: MaintenanceCardProps) {
  const summary = record.items.length > 0 ? record.items.map((item) => item.name).join(', ') : record.description

  return (
    <Link to={`/vehicles/${record.vehicleId}/maintenance/${record.id}`} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.date}>{formatDate(record.maintenanceDate)}</span>
        <span className={styles.cost}>{formatCurrency(record.cost)}</span>
      </div>
      <p className={styles.description}>{summary}</p>
      <span className={styles.odometer}>{record.odometer.toLocaleString()} km</span>
    </Link>
  )
}
