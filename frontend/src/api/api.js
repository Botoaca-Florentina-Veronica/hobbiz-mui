// frontend/src/api/index.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // Fallback pentru development

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// User-related requests
export const login = (credentials) => api.post('/api/users/login', credentials);
export const getProfile = () => api.get('/api/users/profile');
export const register = (userData) => api.post('/api/users/register', userData);

// Alte endpoint-uri...