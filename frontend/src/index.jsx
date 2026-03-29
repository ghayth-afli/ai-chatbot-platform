import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

// Patch ResizeObserver feedback loop issues in Chromium by deferring callbacks
if (typeof window !== "undefined" && window.ResizeObserver) {
  const OriginalResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class PatchedResizeObserver extends (
    OriginalResizeObserver
  ) {
    constructor(callback) {
      super((entries, observer) => {
        window.requestAnimationFrame(() => callback(entries, observer));
      });
    }
  };

  window.addEventListener(
    "error",
    (event) => {
      const message = event?.message || "";
      if (message.includes("ResizeObserver loop completed")) {
        event.stopImmediatePropagation();
      }
    },
    true,
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
