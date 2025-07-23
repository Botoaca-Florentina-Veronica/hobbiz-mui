// Chat messages
export const sendMessage = (data) => apiClient.post('/api/messages', data);
export const getMessages = (conversationId) => apiClient.get(`/api/messages/${conversationId}`);
// Șterge contul utilizatorului și toate anunțurile sale
export const deleteAccount = () => apiClient.delete('/api/users/delete-account');
// frontend/src/api/index.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // Fallback pentru development

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