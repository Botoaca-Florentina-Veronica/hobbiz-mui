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
  // Counter monoton: fiecare apel hydrate primește o generație unică.
  // Înainte de a aplica rezultatele, verificăm că nu a pornit un hydrate mai recent.
  // Asta previne fluctuațiile cauzate de hydrate-uri concurente care se termină în ordine greșită.
  const hydrateGenerationRef = useRef(0);
  // Ref sincronizat cu starea `favorites` pentru a preveni stale closure în toggleFavorite
  // (util când userul face toggle rapid de 2x pe același anunț)
  const favoritesRef = useRef([]);
  
  // Ref pentru a urmări acțiunile "în zbor" (optimistic toggle)
  // Cheie: announcementId, Valoare: 'added' | 'removed'
  const pendingTogglesRef = useRef(new Map());
  
  // Ref pentru a ignora socket events "vechi" după ce am făcut un toggle cu succes
  // După un toggle API reușit, setez acest timestamp și ignor socket events mai vechi
  const ignoreSocketEventsUntilRef = useRef(0);

  // Obține userId curent pentru socket după ce user este setat
  const userId = user?._id;
  const { on, off } = useSocket(userId || null);

  // Helper pentru a aplica pending toggles peste o listă venită de la server
  const applyPendingToggles = useCallback((serverIds) => {
    if (pendingTogglesRef.current.size === 0) return serverIds;
    
    const set = new Set(serverIds);
    pendingTogglesRef.current.forEach((action, id) => {
      if (action === 'added') set.add(id);
      else if (action === 'removed') set.delete(id);
    });
    return Array.from(set);
  }, []);

  // Ține `favoritesRef` mereu sincronizat cu starea curentă
  favoritesRef.current = favorites;

  const hydrate = useCallback(async (opts = {}) => {
    const now = Date.now();
    // Throttling: dacă apelurile sunt prea dese (<3s) și nu e forced
    if (!opts.force && now - lastHydrateRef.current < 3000) return;
    lastHydrateRef.current = now;

    // Fiecare apel hydrate primește o generație unică. Dacă un hydrate mai recent
    // pornește în timp ce acesta așteaptă răspunsul rețelei, rezultatele celui vechi
    // sunt aruncate — asta elimină fluctuațiile cauzate de răspunsuri care ajung
    // în ordine inversă față de ordinea apelurilor.
    const myGeneration = ++hydrateGenerationRef.current;

    let token = null;
    try {
      token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    } catch (e) {
      console.warn('Failed to get token from localStorage:', e);
    }

    if (!token) {
      setUser(null);

      // Guest logic: load from localStorage
      try {
        const local = localStorage.getItem('favoriteAnnouncements_guest');
        if (local) {
          const parsed = JSON.parse(local);
          // Standardize to array of IDs
          if (Array.isArray(parsed)) {
            const ids = parsed.map(item => (typeof item === 'object' && item !== null ? item.id : item));
            setFavorites(ids);
          } else {
             setFavorites([]);
          }
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.warn('Error parsing guest favorites:', err);
        setFavorites([]);
      }

      setFullFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const [profileRes, favRes] = await Promise.all([
        getProfile(),
        apiClient.get('/api/favorites')
      ]);

      // Un hydrate mai recent a pornit între timp — aruncăm rezultatele noastre
      // pentru a nu suprascrie starea deja actualizată de cel mai recent apel.
      if (myGeneration !== hydrateGenerationRef.current) return;

      const profile = profileRes.data;
      const favData = favRes.data || {};

      if (profile?._id) {
        localStorage.setItem('userId', String(profile._id));
      }
      setUser(profile);

      // Aplică pending toggles peste ce vine de la server ca să nu facă revert la UI
      const finalIds = [...new Set(applyPendingToggles(favData.favoriteIds || []))];
      setFavorites(finalIds);

      // Persistă în localStorage astfel încât la refresh paginile de listing
      // să citească imediat starea corectă (fără flash de favorite goale)
      try {
        localStorage.setItem(`favoriteAnnouncements_${profile._id}`, JSON.stringify(finalIds));
      } catch {}

      // Aplică și la fullFavorites: scoate obiectele a căror ID a fost eliminat
      // prin pending toggles (altfel heart-ul apare gol pe un item vizibil în pagină).
      // Deduplicăm și după _id: dacă user.favorites din BD are un ID de 2x (race condition
      // la click rapid), obiectul apărea de 2x în fullFavorites iar filtrul îl trecea de 2x
      // → indexul creștea cu 2 la adăugarea unui singur anunț.
      const pendingRemovedIds = new Set();
      pendingTogglesRef.current.forEach((action, id) => {
        if (action === 'removed') pendingRemovedIds.add(id);
      });
      const seenFullIds = new Set();
      const filteredFull = (favData.favorites || []).filter(item => {
        const id = String(item._id);
        if (pendingRemovedIds.has(id) || seenFullIds.has(id)) return false;
        seenFullIds.add(id);
        return true;
      });
      setFullFavorites(filteredFull);
    } catch (e) {
      if (myGeneration !== hydrateGenerationRef.current) return;
      console.warn('Hydrate failed:', e.response?.data || e.message);
      if (e.response?.status === 401) {
        // Asigură-te că nu ștergem un token abia setat de OAuthSuccess
        const currentToken = localStorage.getItem('token');
        if (token && currentToken && token !== currentToken) {
          console.warn('Ignor 401: a apărut un token nou în timpul cererii.');
          return;
        }

        // token invalid - șterge toate datele de autentificare + cache-ul de favorite
        try {
          const uid = localStorage.getItem('userId');
          if (uid) localStorage.removeItem(`favoriteAnnouncements_${uid}`);
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('lastAvatarUrl');
        } catch (clearErr) {
          console.warn('Failed to clear invalid tokens:', clearErr);
        }
        setUser(null);
        setFavorites([]);
        window.dispatchEvent(new Event('logout'));
      }
    } finally {
      setLoading(false);
    }
  }, [applyPendingToggles]);

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
    const handleStorage = (e) => {
       // Dacă se modifică cheia favoriteAnnouncements_guest în alt tab si nu suntem logați
       if (e.key === 'favoriteAnnouncements_guest' && !localStorage.getItem('token')) {
          hydrate();
       }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('storage', handleStorage);
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
      // Ignoră socket events în fereastra de după un toggle recent.
      if (Date.now() < ignoreSocketEventsUntilRef.current) {
        console.debug('Ignoring stale socket event');
        return;
      }

      if (payload?.favoriteIds) {
        if (pendingTogglesRef.current.size > 0) {
          // Există toggles în zbor: aplicăm corecția pending direct din socket data.
          const finalIds = applyPendingToggles(payload.favoriteIds);
          setFavorites([...new Set(finalIds)]);
          setFullFavorites(prev => prev.filter(item => finalIds.includes(String(item._id))));
          window.dispatchEvent(new Event('favorites:updated'));
        } else {
          // Niciun pending activ: delegăm la hydrate ca să fie protejat de contorul
          // de generație — evităm ca un socket event mai vechi să suprascrie un hydrate
          // mai recent care s-a terminat deja cu date corecte.
          hydrate();
        }
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
  }, [userId, on, off, hydrate, applyPendingToggles]);

  // Toggle favorite (optimistic + support guest + pending logic)
  const toggleFavorite = async (announcementId) => {
    // Citim din ref (nu din closure) pentru a obține valoarea curentă chiar și la toggle rapid
    const isFav = favoritesRef.current.includes(announcementId);
    
    // Urmărim acțiunea
    pendingTogglesRef.current.set(announcementId, isFav ? 'removed' : 'added');

    // 1. Optimistic Update State
    const optimisticIds = isFav
      ? favoritesRef.current.filter(id => id !== announcementId)
      : [...favoritesRef.current, announcementId];

    setFavorites(optimisticIds);

    // Eliminăm optimisic elementul și din fullFavorites (dacă a fost scos) pentru a actualiza instant numărul ("indexul")
    if (isFav) {
      setFullFavorites(prev => prev.filter(item => String(item._id) !== String(announcementId)));
    }

    // 2. Persist
    if (!user) {
      // Guest logic (no API call, just local storage sync)
      try {
        const local = localStorage.getItem('favoriteAnnouncements_guest');
        let parsed = [];
        if (local) {
           parsed = JSON.parse(local);
           if (!Array.isArray(parsed)) parsed = [];
        }

        if (isFav) {
          // Remove
          parsed = parsed.filter(item => {
             const id = (typeof item === 'object' && item) ? item.id : item;
             return id !== announcementId;
          });
        } else {
          // Add
          // Check duplicate
          const exists = parsed.some(item => {
              const id = (typeof item === 'object' && item) ? item.id : item;
              return id === announcementId;
          });
          if (!exists) {
             parsed.push({ id: announcementId, addedAt: new Date() });
          }
        }
        localStorage.setItem('favoriteAnnouncements_guest', JSON.stringify(parsed));
        window.dispatchEvent(new Event('favorites:updated'));
      } catch (e) {
        console.error("Error updating guest favorites", e);
      }
      // Guest calls are "instant", clean up pending immediately
      pendingTogglesRef.current.delete(announcementId);
      return;
    }

    // Logic pentru User Autentificat (API)
    // Persistăm optimist în localStorage cheia corectă, astfel la refresh
    // listing pages inițializează imediat cu starea corectă (fără flash de favorite goale)
    try { localStorage.setItem(`favoriteAnnouncements_${user._id}`, JSON.stringify(optimisticIds)); } catch {}

    try {
      if (isFav) {
        await apiClient.delete(`/api/favorites/${announcementId}`);
      } else {
        await apiClient.post(`/api/favorites/${announcementId}`);
      }

      // API success! Ignorăm socket events pentru 800ms (fereastra acoperă hydrate-ul de mai jos).
      ignoreSocketEventsUntilRef.current = Date.now() + 800;

      window.dispatchEvent(new Event('favorites:updated'));

      // Așteptăm hydrate-ul cu pending activ → applyPendingToggles corectează date vechi de la server.
      await hydrate({ force: true });
      pendingTogglesRef.current.delete(announcementId);

      // Extindem fereastra de ignorare DUPĂ ce hydrate + pending sunt gata.
      // Motivul: socket events întârziate (> 800ms de la API) ajungeau după ce pending
      // era șters → setFavorites(date_vechi) nu mai putea fi corectat → fluctuații.
      // 2s extra acoperă orice întârziere realistă de rețea a socket event-ului nostru.
      ignoreSocketEventsUntilRef.current = Date.now() + 2000;
    } catch (e) {
      // Revert on error — inclusiv în localStorage
      console.error("Favorites toggle error", e);
      pendingTogglesRef.current.delete(announcementId);

      const revertedIds = isFav
        ? [...favoritesRef.current, announcementId]
        : favoritesRef.current.filter(id => id !== announcementId);
      setFavorites(revertedIds);
      try { localStorage.setItem(`favoriteAnnouncements_${user._id}`, JSON.stringify(revertedIds)); } catch {}

      // Forțăm re-fetch complet pentru a restaura fullFavorites la starea corectă din server.
      // Folosim force:true ca să nu fie blocat de throttle-ul de 3s.
      if (isFav) {
        hydrate({ force: true });
      }

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