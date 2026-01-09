import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import apiClient, { getProfile } from '../api/api';
import useSocket from '../hooks/useSocket';

/*
  AuthContext furnizează:
  - user: obiect utilizator (fără parola) + favoriteIds
  - favorites: array de id-uri favorite
  - fullFavorites: obiecte populate (optional - doar după fetch complet)
  - loading: starea de încărcare inițială
  - refreshUser: reîncarcă profil + favorite
  - toggleFavorite: adaugă/elimină un favorit atât în backend cât și local (optimistic)
*/

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]); // doar ID-uri
  const [fullFavorites, setFullFavorites] = useState([]); // obiecte populate
  const [loading, setLoading] = useState(true);
  const lastHydrateRef = useRef(0);

  // Obține userId curent pentru socket după ce user este setat
  const userId = user?._id;
  const { on, off } = useSocket(userId || null);

  const hydrate = useCallback(async (opts = {}) => {
    const now = Date.now();
    // Throttling: dacă apelurile sunt prea dese (<3s) și nu e forced
    if (!opts.force && now - lastHydrateRef.current < 3000) return;
    lastHydrateRef.current = now;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setUser(null);
      setFavorites([]);
      setFullFavorites([]);
      setLoading(false);
      return;
    }
    try {
      const [profileRes, favRes] = await Promise.all([
        getProfile(),
        apiClient.get('/api/favorites')
      ]);
      const profile = profileRes.data;
      const favData = favRes.data || {};
      setUser(profile);
      setFavorites(favData.favoriteIds || []);
      setFullFavorites(favData.favorites || []);
    } catch (e) {
      console.warn('Hydrate failed:', e.response?.data || e.message);
      if (e.response?.status === 401) {
        // token invalid
        localStorage.removeItem('token');
        setUser(null);
        setFavorites([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate inițial
  useEffect(() => {
    hydrate({ force: true });
  }, [hydrate]);

  // Re-hydrate pe visibility change / focus / online
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') hydrate();
    };
    const handleFocus = () => hydrate();
    const handleOnline = () => hydrate();
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [hydrate]);

  // Interval refresh (stale-while-revalidate) la 60s dacă tab activ
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') hydrate();
    }, 60000);
    return () => clearInterval(id);
  }, [hydrate]);

  // Socket: ascultă evenimente realtime pentru sync
  useEffect(() => {
    if (!userId) return; // așteaptă user autentificat

    const handleFavoritesUpdated = (payload) => {
      // payload: { favoriteIds? } - dacă nu există, facem hydrate complet
      if (payload?.favoriteIds) {
        setFavorites(payload.favoriteIds);
        window.dispatchEvent(new Event('favorites:updated'));
      } else {
        hydrate();
      }
    };
    const handleAnnouncementCreated = () => {
      // Re-hydrate parțial (doar user announcements în paginile care cer) => aici mai simplu full hydrate
      hydrate();
    };
    const handleAnnouncementDeleted = () => {
      hydrate();
    };

    on('favoritesUpdated', handleFavoritesUpdated);
    on('announcementCreated', handleAnnouncementCreated);
    on('announcementDeleted', handleAnnouncementDeleted);
    return () => {
      off('favoritesUpdated', handleFavoritesUpdated);
      off('announcementCreated', handleAnnouncementCreated);
      off('announcementDeleted', handleAnnouncementDeleted);
    };
  }, [userId, on, off, hydrate]);

  // Toggle favorite (optimistic)
  const toggleFavorite = async (announcementId) => {
    if (!user) return { error: 'Neautentificat' };
    const isFav = favorites.includes(announcementId);
    // Optimistic update
    setFavorites((prev) => isFav ? prev.filter(id => id !== announcementId) : [...prev, announcementId]);
    try {
      if (isFav) {
        await apiClient.delete(`/api/favorites/${announcementId}`);
      } else {
        await apiClient.post(`/api/favorites/${announcementId}`);
      }
      // Optionally refresh counts for that announcement elsewhere
      window.dispatchEvent(new Event('favorites:updated'));
    } catch (e) {
      // Revert on error
      setFavorites((prev) => prev);
      return { error: e.response?.data?.error || 'Eroare la actualizare favorite' };
    }
  };

  const value = {
    user,
    favorites,
    fullFavorites,
    loading,
  refreshUser: (opts) => hydrate({ force: !!opts?.force }),
    toggleFavorite
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
