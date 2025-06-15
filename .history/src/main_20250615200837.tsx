import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query";
import App from "./App";
import "./index.css";
import { TelegramProvider } from "./contexts/TelegramContext";
import { UserProvider } from "./contexts/UserContext";
import { BrowserRouter as Router } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <TelegramProvider>
            <UserProvider>
              <App />
            </UserProvider>
          </TelegramProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
