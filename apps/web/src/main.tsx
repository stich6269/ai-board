import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConvexClientProvider } from "./ConvexClientProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexClientProvider>
      <App />
    </ConvexClientProvider>
  </React.StrictMode>
);
