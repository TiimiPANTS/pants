import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ReservationPage } from './pages/ReservationPage.tsx'

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/reserve" replace />,
    },
    {
        path: '/reserve',
        element: <ReservationPage />,
    },
])

export default router
