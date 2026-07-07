import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import storage from '../services/storage';
import api from '../services/api';
import { loginWithCredentials, saveToken, logout as doLogout } from '../services/auth';
import { registerForPushNotificationsAsync } from '../services/notificationService';

interface UserProfile {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  phone?: string;
  localitate?: string;
  createdAt?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  collaborations?: string[];
  notificationSettings?: {
    email: boolean;
    push: boolean;
    messages: boolean;
    reviews: boolean;
    favorites?: boolean;
    promotions: boolean;
  };
}

interface AuthContextType {
  loading: boolean;
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setGuestMode: (enabled: boolean) => void;
}

// Default fallback to prevent crashes
const defaultAuthContext: AuthContextType = {
  loading: true,
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  login: async () => false,
  logout: async () => {},
  restore: async () => {},
  refreshProfile: async () => {},
  setGuestMode: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const res = await api.get('/api/users/profile');
      const userData = res.data;

      // Backend returnează direct obiectul user fără wrapper
      if (userData && userData._id) {
        const profile: UserProfile = {
          id: userData._id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.avatar || null,
          phone: userData.phone,
          localitate: userData.localitate,
          createdAt: userData.createdAt,
          isVerified: userData.isVerified || false,
          isAdmin: userData.isAdmin || false,
          collaborations: userData.collaborations || [],
          notificationSettings: userData.notificationSettings || {
            email: true,
            push: true,
            messages: true,
            reviews: true,
            favorites: true,
            promotions: false
          },
        };

        // Ensure favorites key exists for older backend payloads
        if (profile.notificationSettings && typeof (profile.notificationSettings as any).favorites === 'undefined') {
          (profile.notificationSettings as any).favorites = true;
        }

        setUser(profile);
        return profile;
      } else {
        setUser(null);
        return null;
      }
    } catch (e) {
      setUser(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await storage.getItemAsync('userToken');
      if (stored) {
        setToken(stored);
        try {
          const profile = await fetchProfile();
          setIsGuest(false); // User is authenticated, not a guest
          // Delay push permission request so the initial navigation settles first.
          // Without this, the system dialog appears while two screens are still
          // overlapping, giving a false "frozen" appearance.
          setTimeout(async () => {
            try {
              const allowPush = profile?.notificationSettings?.push !== false;
              if (allowPush) {
                const tokenValue = await registerForPushNotificationsAsync();
                if (tokenValue) {
                  try { await storage.setItemAsync('pushToken', tokenValue); } catch (_) {}
                  try { await api.post('/api/users/push-token', { token: tokenValue }); } catch (_) {}
                }
              }
            } catch (_) {}
          }, 1500);
        } catch (profileErr) {
          // If profile fetch fails (e.g., expired token), clear token
          console.warn('[Auth] Failed to fetch profile, clearing token');
          setToken(null);
          setUser(null);
          await storage.deleteItemAsync('userToken');
        }
      } else {
        setUser(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    restore();
  }, [restore]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setIsGuest(false);
    try {
      const data = await loginWithCredentials(email, password);
      if (data?.token) {
        await saveToken(data.token);
        setToken(data.token);
        const profile = await fetchProfile();

        // Delay so the post-login navigation transition finishes before the
        // system notification permission dialog appears.
        setTimeout(async () => {
          try {
            const allowPush = profile?.notificationSettings?.push !== false;
            if (allowPush) {
              const tokenValue = await registerForPushNotificationsAsync();
              if (tokenValue) {
                try { await storage.setItemAsync('pushToken', tokenValue); } catch (_) {}
                try { await api.post('/api/users/push-token', { token: tokenValue }); } catch (_) {}
              }
            }
          } catch (_) {}
        }, 1000);

        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (e: any) {
      console.warn('[Auth] login failed', e?.message);
      setLoading(false);
      throw e;
    }
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      let tokenValue: string | null | undefined;
      try {
        tokenValue = await storage.getItemAsync('pushToken');
      } catch (_) {}
      if (!tokenValue) {
        try {
          tokenValue = await registerForPushNotificationsAsync();
        } catch (_) {}
      }

      try {
        if (tokenValue) {
          await api.delete('/api/users/push-token', { data: { token: tokenValue } });
        } else {
          await api.delete('/api/users/push-token');
        }
      } catch (_) {}

      await doLogout();
      setUser(null);
      setIsGuest(false);
      try { await storage.deleteItemAsync('pushToken'); } catch (_) {}
    } finally {
      setLoading(false);
    }
  }, []);

  const setGuestMode = useCallback((enabled: boolean) => {
    setIsGuest(enabled);
    if (enabled) {
      setUser(null);
      setToken(null);
    }
  }, []);

  const isAuthenticated = !!user && !!token && !isGuest;

  const contextValue = useMemo<AuthContextType>(() => ({
    loading, user, token, isAuthenticated,
    isGuest, login, logout, restore, refreshProfile, setGuestMode,
  }), [loading, user, token, isAuthenticated, isGuest, login, logout, restore, refreshProfile, setGuestMode]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};