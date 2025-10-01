import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // 1) Allow explicit override from environment (recommended for production/tests)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // 2) If running in Expo Go or the dev server, try many places where the packager host may be present.
  //    e.g. debuggerHost = "192.168.1.10:19000" -> we want http://192.168.1.10:5000
  const manifestAny: any = (Constants as any).manifest || (Constants as any).expoConfig || {};
  const candidates = [
    manifestAny.debuggerHost,
    manifestAny.packagerOpts?.host,
    // some Expo/Router configs expose packager info under expoConfig
    (Constants as any).expoConfig?.debuggerHost,
    (Constants as any).expoConfig?.packagerOpts?.host,
    // legacy / alternative places
    (Constants as any).manifest2?.debuggerHost,
    (Constants as any).manifest2?.packagerOpts?.host,
  ];

  for (const cand of candidates) {
    if (!cand) continue;
    const host = String(cand).split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000`;
    }
    // if host is localhost, skip because device can't reach it
  }

  // 3) No packager host detected. For Android physical devices, localhost isn't reachable.
  if (Platform.OS === 'android') {
    // Prefer the developer to set EXPO_PUBLIC_API_URL to their machine LAN IP.
    // Log a clear instruction so it's obvious in Expo console.
    // eslint-disable-next-line no-console
    console.warn('[mobile-app] No debuggerHost detected. If you run on a physical Android device, set EXPO_PUBLIC_API_URL to http://<YOUR_PC_IP>:5000');
    // Fallback: still return emulator host so emulators keep working
    return 'http://10.0.2.2:5000';
  }

  // iOS simulator can reach localhost; default there
  return 'http://localhost:5000';
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
});

// Log chosen baseURL for easier debugging in Expo console
try {
  const _base = getBaseUrl();
  // Only log in dev to avoid leaking in production
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[mobile-app] API baseURL =', _base);
    if (typeof _base === 'string' && _base.includes('10.0.2.2')) {
      console.warn('[mobile-app] Detected Android emulator fallback (10.0.2.2). If you run on a physical Android device, set EXPO_PUBLIC_API_URL to http://<YOUR_PC_IP>:5000');
    }
  }
} catch (e) {
  // ignore
}

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

// Better logging for response errors — prints message and requested URL
api.interceptors.response.use(
  (res) => res,
  (error) => {
    try {
      // eslint-disable-next-line no-console
      const cfg = error?.config || {};
      const base = cfg.baseURL || api.defaults.baseURL;
      const url = cfg.url || '(unknown)';
      console.error('[mobile-app] API error:', error?.message, 'baseURL:', base, 'url:', url);
    } catch (e) {
      // ignore
    }
    return Promise.reject(error);
  }
);

export default api;
