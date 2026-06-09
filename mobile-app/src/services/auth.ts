import api from './api';
import storage from './storage';

export interface LoginError extends Error {
  code?: string;
  attemptsLeft?: number;
  lockedUntil?: string;
}

export async function loginWithCredentials(email: string, password: string) {
  try {
    const res = await api.post('/api/users/login', { email, password });
    return res.data;
  } catch (e: any) {
    const data = e?.response?.data;
    const err = new Error(data?.error || 'Eroare la autentificare') as LoginError;
    err.code = data?.code;
    err.attemptsLeft = data?.attemptsLeft;
    err.lockedUntil = data?.lockedUntil;
    throw err;
  }
}

export async function registerWithCredentials(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}) {
  try {
    const res = await api.post('/api/users/register', payload);
    return res.data;
  } catch (e: any) {
    const data = e?.response?.data ?? {};
    const err: any = new Error(data.error || 'Eroare la înregistrare');
    if (data.code) err.code = data.code;
    if (data.daysLeft !== undefined) err.daysLeft = data.daysLeft;
    throw err;
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

export async function updateEmail(newEmail: string, password: string) {
  try {
    const res = await api.put('/api/users/update-email', { newEmail, password });
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.error || 'Eroare la actualizarea email-ului';
    throw new Error(msg);
  }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  try {
    const res = await api.put('/api/users/update-password', { currentPassword, newPassword });
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.error || 'Eroare la schimbarea parolei';
    throw new Error(msg);
  }
}

export async function deleteAccount() {
  try {
    const res = await api.delete('/api/users/delete-account');
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.error || 'Nu s-a putut șterge contul';
    throw new Error(msg);
  }
}

export async function resetUserData() {
  try {
    const res = await api.post('/api/users/reset-data');
    return res.data;
  } catch (e: any) {
    const msg = e?.response?.data?.error || 'Nu s-au putut reseta datele contului';
    throw new Error(msg);
  }
}
