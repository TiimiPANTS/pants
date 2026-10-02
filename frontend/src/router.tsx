import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import { ReservationPage } from "./pages/ReservationPage.tsx";
import ConfirmationPage from "./pages/ConfirmationPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/reserve" replace />,
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
    path: "/reserve/:token",
    element: <ReservationPage key="edit" />,
  },
  {
    path: "/confirmation",
    element: <ConfirmationPage />,
  },
]);

export default router;