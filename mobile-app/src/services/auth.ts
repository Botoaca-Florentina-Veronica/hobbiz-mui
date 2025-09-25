import api from './api';
import * as SecureStore from 'expo-secure-store';

export async function loginWithCredentials(email: string, password: string) {
  const res = await api.post('/login', { username: email, password });
  return res.data;
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync('userToken', token);
}

export async function getToken() {
  return SecureStore.getItemAsync('userToken');
}

export async function logout() {
  await SecureStore.deleteItemAsync('userToken');
}
