import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const getBaseUrl = () => {
  // Implicit folosește backend local pe portul 5000; în producție setează env var
  return process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
});

// Attach token from SecureStore
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

export default api;
