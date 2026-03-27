import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="p-8 text-center">
              <h1 className="text-4xl font-bold text-volt mb-4">nexus AI</h1>
              <p className="text-lg text-gray-400">
                Multi-model chatbot platform
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Frontend environment ready for Phase 1
              </p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
