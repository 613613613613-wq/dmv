import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// React's hydration into #root will replace the boot loader DIV that index.html
// renders pre-paint, so users never see a blank white screen during JS bootup.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        // Opt into v7 behavior now to silence the deprecation warnings and
        // surface any breaking changes early. Both flags are safe for our
        // current routing setup (no splat-relative <Link to="..."> usage).
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
