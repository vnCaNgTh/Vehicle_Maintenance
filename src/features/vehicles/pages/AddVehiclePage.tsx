import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VehicleForm, type VehicleFormValues } from '../components/VehicleForm'
import { createVehicle, VehicleRepositoryError } from '../vehicle.repository'
import styles from './VehicleFormPage.module.css'

export function AddVehiclePage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: VehicleFormValues) {
    setError(null)
    try {
      const vehicle = await createVehicle(values)
      navigate(`/vehicles/${vehicle.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof VehicleRepositoryError ? err.message : 'Could not save this vehicle.')
      throw err
    }
  }

  return (
    <div className={styles.page}>
      <h1>Add vehicle</h1>
      {error && <p className={styles.errorBanner}>{error}</p>}
      <VehicleForm submitLabel="Add vehicle" onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </div>
  )
}
