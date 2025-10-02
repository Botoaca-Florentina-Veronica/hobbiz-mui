import api from './api';
import storage from './storage';

export async function loginWithCredentials(email: string, password: string) {
  try {
    const res = await api.post('/api/users/login', { email, password });
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.error || 'Eroare la autentificare';
    throw new Error(msg);
  }
}

export async function saveToken(token: string) {
  await storage.setItemAsync('userToken', token);
}

export async function getToken() {
  return storage.getItemAsync('userToken');
}

export async function logout() {
  await storage.deleteItemAsync('userToken');
}
