import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { createAppQueryClient } from "./app/query-client";
import { createAppBrowserRouter } from "./app/router";
import "./i18n/i18n";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found.");
}

const queryClient = createAppQueryClient();
const router = createAppBrowserRouter();

createRoot(rootElement).render(
  <StrictMode>
    <App queryClient={queryClient} router={router} />
  </StrictMode>,
);
