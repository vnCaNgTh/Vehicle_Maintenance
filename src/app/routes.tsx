import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { SettingsPage } from '../pages/SettingsPage'
import { VehiclesPage } from '../features/vehicles/pages/VehiclesPage'
import { AddVehiclePage } from '../features/vehicles/pages/AddVehiclePage'
import { EditVehiclePage } from '../features/vehicles/pages/EditVehiclePage'
import { VehicleDetailPage } from '../features/vehicles/pages/VehicleDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'vehicles', element: <VehiclesPage /> },
      { path: 'vehicles/new', element: <AddVehiclePage /> },
      { path: 'vehicles/:id', element: <VehicleDetailPage /> },
      { path: 'vehicles/:id/edit', element: <EditVehiclePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
