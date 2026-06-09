import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

/**
 * Tracks the user's favorites globally — both the count (for the tab badge)
 * and the full set of favorited IDs (so every screen shows the correct heart
 * icon without making its own /api/favorites request).
 *
 * Updates are optimistic: callers call addFavoriteId/removeFavoriteId around
 * their API call and revert if the request fails.
 */
interface FavoritesContextType {
  favoritesCount: number;
  favoriteIds: Set<string>;
  refreshFavoritesCount: () => Promise<void>;
  incrementFavoritesCount: (amount?: number) => void;
  decrementFavoritesCount: (amount?: number) => void;
  setFavoritesCount: (n: number) => void;
  addFavoriteId: (id: string) => void;
  removeFavoriteId: (id: string) => void;
  setFavoriteIds: (ids: Set<string>) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const refreshFavoritesCount = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoritesCount(0);
      setFavoriteIds(new Set());
      return;
    }
    try {
      const res = await api.get('/api/favorites');
      const list = Array.isArray(res.data?.favorites) ? res.data.favorites : [];
      setFavoritesCount(list.length);
      setFavoriteIds(new Set(list.map((f: any) => String(f._id || f)).filter(Boolean)));
    } catch (_) {
      // Silent — badge falls back to last known value.
    }
  }, [isAuthenticated]);

  const incrementFavoritesCount = useCallback((amount: number = 1) => {
    setFavoritesCount(prev => Math.max(0, prev + amount));
  }, []);

  const decrementFavoritesCount = useCallback((amount: number = 1) => {
    setFavoritesCount(prev => Math.max(0, prev - amount));
  }, []);

  const addFavoriteId = useCallback((id: string) => {
    setFavoriteIds(prev => new Set([...prev, id]));
  }, []);

  const removeFavoriteId = useCallback((id: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Re-fetch whenever auth state flips (login / logout).
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshFavoritesCount();
    } else {
      setFavoritesCount(0);
      setFavoriteIds(new Set());
    }
  }, [isAuthenticated, user?.id, refreshFavoritesCount]);

  const value = useMemo<FavoritesContextType>(() => ({
    favoritesCount,
    favoriteIds,
    refreshFavoritesCount,
    incrementFavoritesCount,
    decrementFavoritesCount,
    setFavoritesCount,
    addFavoriteId,
    removeFavoriteId,
    setFavoriteIds,
  }), [
    favoritesCount,
    favoriteIds,
    refreshFavoritesCount,
    incrementFavoritesCount,
    decrementFavoritesCount,
    addFavoriteId,
    removeFavoriteId,
  ]);

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
