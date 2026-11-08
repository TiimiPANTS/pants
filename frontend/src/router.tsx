
import { createBrowserRouter } from "react-router-dom";

import { HomePage } from "./pages/HomePage.tsx";
import { ReservationPage } from "./pages/ReservationPage.tsx";
import ConfirmationPage from "./pages/ConfirmationPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { OwnerDashboardPage } from "./pages/OwnerDashboardPage.tsx";
import { CancelReservationPage } from "./pages/CancelReservationPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/reserve",
    element: <ReservationPage key="new" />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/owner/dashboard",
    element: <OwnerDashboardPage />,
  },
  {
    path: "/reserve/:token",
    element: <ReservationPage key="edit" />,
  },
  {
    path: "/confirmation",
    element: <ConfirmationPage />,
  },
   {
    path: "/owner/reservations/:id/cancel",
    element: <CancelReservationPage />,
  },
]);

export default router;
