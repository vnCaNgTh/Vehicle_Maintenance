import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { SettingsPage } from '../pages/SettingsPage'
import { VehiclesPage } from '../features/vehicles/pages/VehiclesPage'
import { AddVehiclePage } from '../features/vehicles/pages/AddVehiclePage'
import { EditVehiclePage } from '../features/vehicles/pages/EditVehiclePage'
import { VehicleDetailPage } from '../features/vehicles/pages/VehicleDetailPage'
import { AddMaintenancePage } from '../features/maintenance/pages/AddMaintenancePage'
import { EditMaintenancePage } from '../features/maintenance/pages/EditMaintenancePage'
import { MaintenanceDetailPage } from '../features/maintenance/pages/MaintenanceDetailPage'

// Matches Vite's `base` so routing/links work under the GitHub Pages subpath.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'vehicles', element: <VehiclesPage /> },
        { path: 'vehicles/new', element: <AddVehiclePage /> },
        { path: 'vehicles/:id', element: <VehicleDetailPage /> },
        { path: 'vehicles/:id/edit', element: <EditVehiclePage /> },
        { path: 'vehicles/:vehicleId/maintenance/new', element: <AddMaintenancePage /> },
        { path: 'vehicles/:vehicleId/maintenance/:maintenanceId', element: <MaintenanceDetailPage /> },
        { path: 'vehicles/:vehicleId/maintenance/:maintenanceId/edit', element: <EditMaintenancePage /> },
        { path: 'settings', element: <SettingsPage /> },
      ],
    },
  ],
  { basename },
)
