import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient, { getProfile } from '../api/api';

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

  const hydrate = useCallback(async () => {
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

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
    refreshUser: hydrate,
    toggleFavorite
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
