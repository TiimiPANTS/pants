
import { createBrowserRouter } from "react-router-dom";

import { HomePage } from "./pages/HomePage.tsx";
import { ReservationPage } from "./pages/ReservationPage.tsx";
import ConfirmationPage from "./pages/ConfirmationPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";

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
    path: "/reserve/:token",
    element: <ReservationPage key="edit" />,
  },
  {
    path: "/confirmation",
    element: <ConfirmationPage />,
  },
]);

export default router;
