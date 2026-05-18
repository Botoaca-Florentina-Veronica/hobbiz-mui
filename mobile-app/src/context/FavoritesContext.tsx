import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

/**
 * Tracks the user's favorites count globally so the bottom-tab badge stays in
 * sync no matter where a favorite is toggled (favorites screen, announcement
 * details, search results, etc.).
 *
 * Updates are optimistic — callers should `incrementCount`/`decrementCount`
 * around their API call and revert via the opposite call if the request fails.
 */
interface FavoritesContextType {
  favoritesCount: number;
  refreshFavoritesCount: () => Promise<void>;
  incrementFavoritesCount: (amount?: number) => void;
  decrementFavoritesCount: (amount?: number) => void;
  setFavoritesCount: (n: number) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState(0);

  const refreshFavoritesCount = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoritesCount(0);
      return;
    }
    try {
      const res = await api.get('/api/favorites');
      const count = Array.isArray(res.data?.favorites) ? res.data.favorites.length : 0;
      setFavoritesCount(count);
    } catch (_) {
      // Silent — the badge falls back to its last known value.
    }
  }, [isAuthenticated]);

  const incrementFavoritesCount = useCallback((amount: number = 1) => {
    setFavoritesCount(prev => Math.max(0, prev + amount));
  }, []);

  const decrementFavoritesCount = useCallback((amount: number = 1) => {
    setFavoritesCount(prev => Math.max(0, prev - amount));
  }, []);

  // Re-fetch the count whenever the auth state flips (login / logout)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshFavoritesCount();
    } else {
      setFavoritesCount(0);
    }
  }, [isAuthenticated, user?.id, refreshFavoritesCount]);

  const value = useMemo<FavoritesContextType>(() => ({
    favoritesCount,
    refreshFavoritesCount,
    incrementFavoritesCount,
    decrementFavoritesCount,
    setFavoritesCount,
  }), [favoritesCount, refreshFavoritesCount, incrementFavoritesCount, decrementFavoritesCount]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavoritesCount = () => {
  const ctx = useContext(FavoritesContext);
  if (ctx === undefined) {
    throw new Error('useFavoritesCount must be used within a FavoritesProvider');
  }
  return ctx;
};
