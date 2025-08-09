// Chat messages
export const sendMessage = (data) => apiClient.post('/api/messages', data);
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
if (!API_URL) {
  const isDev = import.meta.env.MODE === 'development';
  if (isDev) {
    API_URL = 'http://localhost:5000';
  } else if (typeof window !== 'undefined') {
    // fallback: același origin (utile pentru reverse proxy sau single-origin deploy)
    API_URL = `${window.location.origin}`;
  }
}

// Configurare instanță Axios
const apiClient = axios.create({
  baseURL: API_URL,
});

// Adaugă token-ul JWT în header-ul Authorization pentru toate request-urile
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User-related requests
export const login = (credentials) => apiClient.post('/api/users/login', credentials);
export const getProfile = () => apiClient.get('/api/users/profile');
export const register = (userData) => apiClient.post('/api/users/register', userData);
export const updateEmail = (newEmailData) => apiClient.put('/api/users/update-email', newEmailData);
export const updatePassword = (passwordData) => apiClient.put('/api/users/update-password', passwordData);
export const updateProfile = (profileData) => apiClient.put('/api/users/profile', profileData);
export const detectMitm = () => apiClient.get('/api/mitm/detect-mitm');


// Logout request (pentru sesiuni/cookie-uri)
export const logout = () => apiClient.get('/auth/logout', { withCredentials: true });

export default apiClient;