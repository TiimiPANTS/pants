import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import { ReservationPage } from "./pages/ReservationPage.tsx";
import ConfirmationPage from "./pages/ConfirmationPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/reserve" replace />,
  },
  {
    path: "/reserve",
    element: <ReservationPage />,
  },
  {
    path: "/confirmation",
    element: <ConfirmationPage />,
  },
]);

export default router;