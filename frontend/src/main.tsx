import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.css";
import App from "./App.tsx";

import { installApiInterceptor } from "./services/api";

// Enable automatic JWT handling for API requests
installApiInterceptor();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
