import React, { useEffect, useState } from 'react';
// Integrare cu AuthContext pentru favorite persistente + fallback guest localStorage
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import './FavoriteAnnouncements.css';
import { useAuth } from '../context/AuthContext.jsx';
import gumballSiDarwin from '../assets/images/gumballSiDarwin.png';

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 1800);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="toast">
      <span className="toast-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2l4-4"/></svg>
      </span>
      Șters din favorite
    </div>
  );
}

export default function FavoriteAnnouncements() {
  const navigate = useNavigate();
  const { user, favorites: authFavoriteIds, fullFavorites, toggleFavorite } = useAuth() || {};
  // Guest localStorage fallback
  const guestUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const FAVORITES_KEY = guestUserId ? `favoriteAnnouncements_${guestUserId}` : 'favoriteAnnouncements_guest';

  const isAuthenticated = !!user;

  // Local state only used for guest mode
  const [guestFavoriteIds, setGuestFavoriteIds] = useState(() => {
    if (isAuthenticated) return []; // auth path ignores localStorage
    const stored = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_KEY) : null;
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        const converted = parsed.map(id => ({ id, addedAt: Date.now() }));
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(converted));
        return parsed;
      } else {
        return parsed.map(item => item.id);
      }
    } catch { return []; }
  });

  const [guestFavoriteObjects, setGuestFavoriteObjects] = useState(() => {
    if (isAuthenticated) return [];
    const stored = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_KEY) : null;
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed.map(id => ({ id, addedAt: Date.now() }));
      }
      return parsed;
    } catch { return []; }
  });

  const [guestAnnouncements, setGuestAnnouncements] = useState([]);
  const [showToast, setShowToast] = useState(false);

  // Listen for favorites updates from other components (same-tab) and refresh guest lists
  useEffect(() => {
    const handler = () => {
      if (isAuthenticated) return; // auth path handled by context
      const stored = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_KEY) : null;
      if (!stored) {
        setGuestFavoriteIds([]);
        setGuestFavoriteObjects([]);
        setGuestAnnouncements([]);
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        const ids = parsed.length > 0 && typeof parsed[0] === 'string' ? parsed : parsed.map(p => p.id);
        setGuestFavoriteIds(ids);
        setGuestFavoriteObjects(parsed.length > 0 && typeof parsed[0] === 'string' ? parsed.map(id => ({ id, addedAt: Date.now() })) : parsed);
      } catch {
        setGuestFavoriteIds([]);
        setGuestFavoriteObjects([]);
      }
    };
    window.addEventListener('favorites:updated', handler);
    return () => window.removeEventListener('favorites:updated', handler);
  }, [isAuthenticated, FAVORITES_KEY]);

  // Guest mode: fetch announcements then filter
  useEffect(() => {
    if (isAuthenticated) return; // skip guest-only logic
    if (guestFavoriteIds.length === 0) {
      setGuestAnnouncements([]);
      return;
    }
    apiClient.get('/api/announcements')
      .then(res => {
        const filtered = res.data.filter(a => guestFavoriteIds.includes(a._id));
        const sorted = filtered.sort((a, b) => {
          const aFav = guestFavoriteObjects.find(f => f.id === a._id);
          const bFav = guestFavoriteObjects.find(f => f.id === b._id);
          if (!aFav || !bFav) return 0;
          return bFav.addedAt - aFav.addedAt;
        });
        setGuestAnnouncements(sorted);
      })
      .catch(() => setGuestAnnouncements([]));
  }, [isAuthenticated, guestFavoriteIds, guestFavoriteObjects, FAVORITES_KEY]);

  const handleToggleFavorite = (id) => {
    if (isAuthenticated) {
      toggleFavorite?.(id);
      // Nu avem încă actualizare optimistă pentru fullFavorites; se poate adăuga ulterior.
      return;
    }
    // Guest local storage path (legacy)
    setGuestFavoriteObjects(prev => {
      let updated;
      const exists = prev.find(item => item.id === id);
      if (exists) {
        updated = prev.filter(item => item.id !== id);
        setShowToast(true);
        apiClient.delete(`/api/announcements/${id}/favorite`).catch(() => {}); // optional: sync global count
      } else {
        updated = [...prev, { id, addedAt: Date.now() }];
        apiClient.post(`/api/announcements/${id}/favorite`).catch(() => {});
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('favorites:updated'));
      return updated;
    });
    setGuestFavoriteIds(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <>
      <div className="my-announcements-container">
        {showToast && <Toast message="Șters din favorite" onClose={() => setShowToast(false)} />}
        {/* Mobile header: back + title */}
        <div className="mobile-header">
          <IconButton
            onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
            className="mobile-back-btn"
            disableRipple
            disableFocusRipple
            aria-label="Înapoi"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" className="mobile-header-title">Favorite</Typography>
        </div>
        <h1 className="my-announcements-title">Anunturile tale favorite</h1>
        <div className="favorite-count">
          Anunțuri favorite ({(isAuthenticated ? (fullFavorites?.length || 0) : guestAnnouncements.length)}/150)
        </div>
        {(isAuthenticated ? (fullFavorites?.length === 0) : (guestAnnouncements.length === 0)) ? (
          <div className="favorites-empty">
            <div className="favorites-empty-icon">
              <img src={gumballSiDarwin} alt="Favorite goale" />
            </div>
            <div className="favorites-empty-text">Nu ai anunturi favorite salvate, e timpul să îți adaugi</div>
          </div>
        ) : (
          <div className="favorite-announcements-list">
            {(isAuthenticated ? fullFavorites : guestAnnouncements).map((a) => (
              <div
                key={a._id}
                className="favorite-announcement-card"
                onClick={e => {
                  if (e.target.closest('.favorite-heart')) return;
                  window.location.href = `/announcement/${a._id}`;
                }}
              >
              <div className="favorite-announcement-image">
                {a.images && a.images[0] ? (
                  <img
                    src={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                      ? a.images[0]
                      : `/uploads/${a.images[0].replace(/^.*[\\\\/]/, '')}`}
                    alt="imagine principala"
                    className="favorite-announcement-img"
                  />
                ) : (
                  <div className="favorite-announcement-img placeholder" />
                )}
              </div>
              <div className="favorite-announcement-info">
                <div className="favorite-info-top">
                  <span className="favorite-date">
                    {a.createdAt ? `Postat ${new Date(a.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
                  </span>
                  <div className={`favorite-heart ${(isAuthenticated ? authFavoriteIds : guestFavoriteIds).includes(a._id) ? 'filled' : ''}`}
                    onClick={ev => { ev.stopPropagation(); handleToggleFavorite(a._id); }}
                  >
                    {(isAuthenticated ? authFavoriteIds : guestFavoriteIds).includes(a._id) ? (
                      <FavoriteIcon />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </div>
                </div>
                <h2 className="favorite-announcement-title">{a.title}</h2>
                <div className="favorite-announcement-category">{a.category}</div>
                <div className="favorite-announcement-location">{a.location}</div>
                {a.price && <div className="favorite-price">{a.price} €</div>}
              </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* separatorul este inclus în Footer, nu mai este nevoie aici */}
    </>
  );
}
