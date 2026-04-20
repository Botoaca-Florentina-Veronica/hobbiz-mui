// main.jsx sau index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Adaugă această linie
// import axios from 'axios';
import App from "./App";
import { AuthProvider } from './context/AuthContext.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import "./index.css";
import './i18n';

// URL-ul de deploy Render nu trebuie setat ca baseURL pentru toată aplicația
// El este doar un webhook de declanșare pentru serverul de producție, nu API-ul tău!
// Setările corecte de API sunt gestionate de api/api.js

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);