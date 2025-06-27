import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router } from "react-router-dom";

import { App } from "@/app/providers/App";
import { initReactScan } from "@/shared/lib/react-scan";
import { QueryProvider } from "@/shared/query/query-provider";

import { AuthProvider } from "./providers";
import { ErrorBoundary } from "./providers/ErrorBoundary";

import "@/shared/styles/index.css";

initReactScan();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <HelmetProvider>
          <QueryProvider>
            <AuthProvider>
              <App />
              <Toaster position="top-left" />
            </AuthProvider>
          </QueryProvider>
        </HelmetProvider>
      </Router>
    </ErrorBoundary>
  </StrictMode>,
);
