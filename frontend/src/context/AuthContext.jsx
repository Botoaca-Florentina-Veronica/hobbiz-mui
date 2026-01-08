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
  // Don't initialize from cache; always hydrate from server on mount
  // This ensures the displayed count always matches server reality
  const [favorites, setFavorites] = useState([]); // start empty, let hydrate fill it
  const [fullFavorites, setFullFavorites] = useState([]); // obiecte populate
  const [loading, setLoading] = useState(true);
  const lastHydrateRef = useRef(0);
  const favoritesRef = useRef([]);
  const fullFavoritesRef = useRef([]);
  const inFlightFavoriteTogglesRef = useRef(new Set());

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  useEffect(() => {
    fullFavoritesRef.current = fullFavorites;
  }, [fullFavorites]);

  // Ensure we can populate full favorites objects when we only have IDs
  const populateFullFavorites = useCallback(async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const missing = ids.filter(id => !fullFavoritesRef.current.some(a => a?._id === id));
    if (missing.length === 0) return;
    try {
      const requests = missing.map(id => apiClient.get(`/api/announcements/${id}`).then(r => r.data).catch(() => ({ _id: id, _notFound: true })));
      const results = await Promise.all(requests);

      // Filter out not found/errored
      const fetched = results.filter(r => r && !r._notFound);

      // If any fetched announcement is archived, remove it from favorites (server + client) and skip adding
      const archivedIds = fetched.filter(a => a.archived).map(a => a._id);
      if (archivedIds.length > 0) {
        // remove from client favorites
        setFavorites(prev => prev.filter(id => !archivedIds.includes(id)));
        // inform server (best-effort)
        archivedIds.forEach(id => {
          apiClient.delete(`/api/favorites/${id}`).catch(() => {});
        });
        // notify other components
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('favorites:updated'));
      }

      const valid = fetched.filter(a => !a.archived);
      if (valid.length > 0) {
        setFullFavorites(prev => {
          const existing = new Set((prev || []).map(a => a._id));
          const toAdd = valid.filter(a => !existing.has(a._id));
          return [...toAdd, ...(prev || [])];
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);


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
      // Persist to localStorage after hydrating from server
      try {
        localStorage.setItem('auth_favorites', JSON.stringify(favData.favoriteIds || []));
      } catch { }
    } catch (e) {
      console.warn('Hydrate failed:', e.response?.data || e.message);
      if (e.response?.status === 401) {
        // token invalid
        localStorage.removeItem('token');
        localStorage.removeItem('auth_favorites');
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

  // Persist favorites to localStorage so on refresh UI can show correct state instantly
  useEffect(() => {
    try {
      if (favorites && favorites.length >= 0) {
        localStorage.setItem('auth_favorites', JSON.stringify(favorites));
      }
    } catch { }
  }, [favorites]);
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

    // Guard against rapid double-clicks / concurrent toggles for the same id
    if (inFlightFavoriteTogglesRef.current.has(announcementId)) return;
    inFlightFavoriteTogglesRef.current.add(announcementId);

    const isFav = favoritesRef.current.includes(announcementId);
    const prevFullFavorites = fullFavoritesRef.current;

    // Compute new favorites optimistically and update immediately
    const prevFavorites = favoritesRef.current;
    const newFavorites = isFav ? prevFavorites.filter(id => id !== announcementId) : [...prevFavorites, announcementId];
    setFavorites(() => newFavorites);
    // Immediately notify others with payload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('favorites:updated', { detail: { favoriteIds: newFavorites } }));
    }

    // Keep fullFavorites from showing stale removed items.
    if (isFav) {
      setFullFavorites((prev) => (Array.isArray(prev) ? prev.filter((a) => a?._id !== announcementId) : []));
    }

    try {
      if (isFav) {
        await apiClient.delete(`/api/favorites/${announcementId}`);
      } else {
        await apiClient.post(`/api/favorites/${announcementId}`);
        // fetch the announcement object and add to fullFavorites so UI can render immediately
        try {
          const res = await apiClient.get(`/api/announcements/${announcementId}`);
          const ann = res.data;
          if (ann && ann._id) {
            if (ann.archived) {
              // If the announcement is archived, remove from favorites both client & server
              setFavorites(prev => prev.filter(id => id !== ann._id));
              try { apiClient.delete(`/api/favorites/${ann._id}`).catch(() => {}); } catch {}
              if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('favorites:updated', { detail: { favoriteIds: (favoritesRef.current || []).filter(id => id !== ann._id) } }));
              // Inform user
              try { if (typeof window !== 'undefined' && window.showToast) window.showToast('Anunțul a fost arhivat și a fost eliminat din favorite', 'info'); } catch {}
            } else {
              setFullFavorites(prev => {
                const list = Array.isArray(prev) ? prev : [];
                if (list.some(a => a._id === ann._id)) return list;
                return [ann, ...list];
              });
            }
          }
        } catch (fetchErr) {
          // ignore
        }
      }
      // API request already confirmed the change; state was updated optimistically
    } catch (e) {
      // Revert only this id on error (keep other changes)
      setFavorites((prev) => {
        const has = prev.includes(announcementId);
        if (isFav) {
          // We tried to remove, so add back if missing
          return has ? prev : [...prev, announcementId];
        }
        // We tried to add, so remove if present
        return has ? prev.filter((id) => id !== announcementId) : prev;
      });

      // Revert fullFavorites only for the affected id
      if (isFav) {
        const restore = Array.isArray(prevFullFavorites)
          ? prevFullFavorites.find((a) => a?._id === announcementId)
          : null;
        if (restore) {
          setFullFavorites((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            return list.some((a) => a?._id === announcementId) ? list : [restore, ...list];
          });
        }
      }
      // Notify on error to update UI with reverted state
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('favorites:updated', { detail: { favoriteIds: favoritesRef.current } }));
      }
      return { error: e.response?.data?.error || 'Eroare la actualizare favorite' };
    } finally {
      inFlightFavoriteTogglesRef.current.delete(announcementId);
    }
  };

  const value = {
    user,
    favorites,
    fullFavorites,
    loading,
    refreshUser: (opts) => hydrate({ force: !!opts?.force }),
    toggleFavorite,
    populateFullFavorites
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
