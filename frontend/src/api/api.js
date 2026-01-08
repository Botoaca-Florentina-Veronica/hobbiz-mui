// Chat messages
export const sendMessage = (data) => apiClient.post('/api/messages', data);
export const sendMessageMultipart = (formData) =>
  apiClient.post('/api/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
// Align with backend: GET /api/messages/conversation/:conversationId
export const getMessages = (conversationId) => apiClient.get(`/api/messages/conversation/${conversationId}`);
export const deleteMessage = (id) => apiClient.delete(`/api/messages/${id}`);
// Fetch messages between two users
export const getMessagesBetween = (userId1, userId2) => apiClient.get(`/api/messages/between/${userId1}/${userId2}`);
// Șterge contul utilizatorului și toate anunțurile sale
export const deleteAccount = () => apiClient.delete('/api/users/delete-account');
// frontend/src/api/index.js
import axios from 'axios';

// Determină baza API:
// - În dev: folosește localhost dacă VITE_API_URL nu e setat
// - În producție (Netlify): cere VITE_API_URL; fără ea, deduce din origin (același host) ca fallback sigur
let API_URL = import.meta.env.VITE_API_URL;
// Defensive: `.env` values sometimes contain inline comments or trailing spaces (e.g. "... # comment")
// which can break URL parsing in browsers/axios.
if (typeof API_URL === 'string') {
  API_URL = API_URL.split('#')[0].trim();
  // Avoid double slashes when callers use absolute paths
  if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);
}
if (!API_URL) {
  const isDev = import.meta.env.MODE === 'development';
  if (isDev) {
    API_URL = 'http://localhost:5000';
  } else if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Dacă suntem pe Netlify și nu avem VITE_API_URL, folosește backend-ul pe Render (configurat în CORS)
    if (/\.netlify\.app$/.test(host)) {
      API_URL = 'https://hobbiz-mui.onrender.com';
    } else {
      // fallback: același origin (utile pentru reverse proxy sau single-origin deploy)
      API_URL = `${window.location.origin}`;
    }
  }
}

// Configurare instanță Axios
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

// Debug baseURL once
if (typeof window !== 'undefined') {
  console.log('API baseURL:', API_URL);
}

// Adaugă token-ul JWT în header-ul Authorization pentru toate request-urile
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: Avoid global redirects on 401; let callers decide
apiClient.interceptors.response?.use(
  (resp) => resp,
  (error) => {
    // Pass through 401 without redirecting
    return Promise.reject(error);
  }
);

// User-related requests
export const login = (credentials) => apiClient.post('/api/users/login', credentials);
export const getProfile = () => apiClient.get('/api/users/profile');
export const register = (userData) => apiClient.post('/api/users/register', userData);
export const updateEmail = (newEmailData) => apiClient.put('/api/users/update-email', newEmailData);
export const updatePassword = (passwordData) => apiClient.put('/api/users/update-password', passwordData);
export const updateProfile = (profileData) => apiClient.put('/api/users/profile', profileData);
export const detectMitm = () => apiClient.get('/api/mitm/detect-mitm');

// Announcement search for autocomplete suggestions
export const searchAnnouncements = (searchQuery) => apiClient.get(`/api/announcements/search?q=${encodeURIComponent(searchQuery)}`);

// Logout request (pentru sesiuni/cookie-uri)
export const logout = () => apiClient.get('/auth/logout', { withCredentials: true });

export default apiClient;