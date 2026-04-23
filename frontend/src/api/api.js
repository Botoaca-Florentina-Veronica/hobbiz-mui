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
// Resetează datele utilizatorului fără a șterge contul
export const resetUserData = () => apiClient.post('/api/users/reset-data');
// frontend/src/api/index.js
import axios from 'axios';

// Determină baza API:
// - În dev: folosește localhost dacă VITE_API_URL nu e setat
// - În producție (Netlify): cere VITE_API_URL; fără ea, deduce din origin (același host) ca fallback sigur
let API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  const isDev = import.meta.env.MODE === 'development';
  if (isDev) {
    API_URL = ''; // URL relativ – Vite proxy redirecționează /api → localhost:3000
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
  withCredentials: true,
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
}, (error) => {
  return Promise.reject(error);
});

// Interceptor pentru răspunsuri - gestionează 401 (token invalid/expirat)
apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // Dacă primim 401 (Unauthorized), curăță token-urile invalide
    if (error.response?.status === 401) {
      try {
        const currentToken = localStorage.getItem('token');
        const requestToken = error.config?.headers?.Authorization?.replace('Bearer ', '');
        
        // Doar dacă există un token curent și tokenul respins este același (pentru a preveni ștergerea noului token la login/OAuth)
        if (currentToken && requestToken === currentToken) {
          console.warn('Token invalid sau expirat - curățare automată');
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('lastAvatarUrl');
          // Dispatch logout event pentru a actualiza UI-ul
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('logout'));
          }
        }
      } catch (e) {
        console.warn('Failed to clear invalid token:', e);
      }
    }
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

// --- VERIFICATION SYSTEM ---
// User functions
export const uploadVerificationDocument = (formData) => 
  apiClient.post('/api/users/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getUserDocuments = () => apiClient.get('/api/users/documents');
export const deleteUserDocument = (documentId) => apiClient.delete(`/api/users/documents/${documentId}`);

// Admin functions
export const getPendingVerifications = () => apiClient.get('/api/users/admin/verifications/pending');
export const getUserDocumentsAdmin = (userId) => apiClient.get(`/api/users/admin/users/${userId}/documents`);
export const verifyDocument = (userId, documentId, data) => 
  apiClient.put(`/api/users/admin/users/${userId}/documents/${documentId}/verify`, data);
export const toggleUserVerification = (userId, data) => 
  apiClient.put(`/api/users/admin/users/${userId}/verification-badge`, data);
export const getContactFallbacks = (status = 'open') =>
  apiClient.get(`/api/contact/fallbacks?status=${encodeURIComponent(status)}`);
export const resolveContactFallback = (id) =>
  apiClient.patch(`/api/contact/fallbacks/${id}/resolve`);
export const deleteContactFallback = (id) =>
  apiClient.delete(`/api/contact/fallbacks/${id}`);

export const createAnnouncementReport = (announcementId, data) =>
  apiClient.post('/api/reports', { announcementId, ...data });
export const getAnnouncementReports = (status = 'open') =>
  apiClient.get(`/api/reports?status=${encodeURIComponent(status)}`);
export const resolveAnnouncementReport = (id, data = {}) =>
  apiClient.patch(`/api/reports/${id}/resolve`, data);
export const deleteAnnouncementReport = (id) =>
  apiClient.delete(`/api/reports/${id}`);

// Announcement search for autocomplete suggestions (lightweight)
export const suggestAnnouncements = (query, signal) =>
  apiClient.get(`/api/announcements/suggest?q=${encodeURIComponent(query)}`, { signal });

// Full announcement search (used on search results page)
export const searchAnnouncements = (query, signal, location) => {
  const params = new URLSearchParams({ q: query });
  if (location) params.set('location', location);
  return apiClient.get(`/api/announcements/search?${params.toString()}`, { signal });
};

// Logout request (pentru sesiuni/cookie-uri)
export const logout = () => apiClient.get('/auth/logout', { withCredentials: true });

export default apiClient;