// main.jsx sau index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Adaugă această linie
import axios from 'axios';
import App from "./App";
import "./index.css";

axios.defaults.baseURL = 'https://api.render.com/deploy/srv-d0fljpa4d50c73f1ia80?key=avPZG38IhSo';
axios.interceptors.request.use((config) => {
  console.log('Cerere trimisă:', config);
  console.log('Antetul cererii:', config.headers);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter> {/* Înfășoară aplicația aici */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);