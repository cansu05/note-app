import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./shared/components/AppErrorBoundary";
import "./styles/colors.css";
import "./styles/base.css";
import "./features/notes/notes.css";
import "./features/auth/auth.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
