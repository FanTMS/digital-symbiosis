import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query";
import App from "./App";
import "./index.css";
import { TelegramProvider } from "./contexts/TelegramContext";
import { UserProvider } from "./contexts/UserContext";
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode data-oid="f_hq7g4">
    <QueryClientProvider client={queryClient} data-oid="hp1w::a">
      <Router data-oid="or1rgsv">
        <TelegramProvider data-oid="ao_.mlj">
          <UserProvider data-oid="8xbv93u">
            <App data-oid="vm6en_3" />
          </UserProvider>
        </TelegramProvider>
      </Router>
    </QueryClientProvider>
  </React.StrictMode>,
);
