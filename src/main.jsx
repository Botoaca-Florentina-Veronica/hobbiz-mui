// main.jsx sau index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Adaugă această linie
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter> {/* Înfășoară aplicația aici */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);