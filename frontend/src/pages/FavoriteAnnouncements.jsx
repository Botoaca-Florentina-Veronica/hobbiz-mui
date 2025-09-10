import React, { useEffect, useState } from 'react';
// TODO: Migrare către AuthContext (favorites persistente). Pagină păstrată temporar pentru compatibilitate.
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import './FavoriteAnnouncements.css';

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
  const [announcements, setAnnouncements] = useState([]);
  const navigate = useNavigate();
  // Cheie unică pentru favorite per utilizator
  const userId = localStorage.getItem('userId');
  const FAVORITES_KEY = userId ? `favoriteAnnouncements_${userId}` : 'favoriteAnnouncements_guest';
  
  const [favoriteIds, setFavoriteIds] = useState(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      // Verifică dacă e în formatul vechi (array de string-uri) sau nou (array de obiecte)
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        // Convertește din formatul vechi în cel nou
        const converted = parsed.map(id => ({ id, addedAt: Date.now() }));
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(converted));
        return parsed; // returnează ID-urile pentru compatibilitate
      } else {
        // Format nou - returnează doar ID-urile pentru compatibilitate
        return parsed.map(item => item.id);
      }
    } catch {
      return [];
    }
  });
  
  const [favoriteObjects, setFavoriteObjects] = useState(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        // Format vechi - convertește
        return parsed.map(id => ({ id, addedAt: Date.now() }));
      } else {
        // Format nou
        return parsed;
      }
    } catch {
      return [];
    }
  });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setAnnouncements([]);
      return;
    }
    apiClient.get(`/api/announcements`)
      .then(res => {
        const filtered = res.data.filter(a => favoriteIds.includes(a._id));
        
        // Sortează anunțurile în ordinea în care au fost adăugate în favorite (cel mai recent primul)
        const sorted = filtered.sort((a, b) => {
          const aFavorite = favoriteObjects.find(fav => fav.id === a._id);
          const bFavorite = favoriteObjects.find(fav => fav.id === b._id);
          
          if (!aFavorite || !bFavorite) return 0;
          return bFavorite.addedAt - aFavorite.addedAt; // Cel mai recent primul
        });
        
        setAnnouncements(sorted);
      })
      .catch(() => setAnnouncements([]));
  }, [favoriteIds, favoriteObjects, FAVORITES_KEY]);

  const handleToggleFavorite = (id) => {
    setFavoriteObjects((prev) => {
      let updated;
      const exists = prev.find(item => item.id === id);
      
      if (exists) {
        // Elimină din favorite (optimistic)
        updated = prev.filter((item) => item.id !== id);
        setShowToast(true);
        // Backend: decrement favoritesCount
        apiClient.delete(`/api/announcements/${id}/favorite`).catch(() => {});
      } else {
        // Adaugă în favorite cu timestamp-ul curent (optimistic)
        updated = [...prev, { id, addedAt: Date.now() }];
        // Backend: increment favoritesCount
        apiClient.post(`/api/announcements/${id}/favorite`).catch(() => {});
      }
      
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      // Notifică restul aplicației că favoritele s-au schimbat
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('favorites:updated'));
      }
      return updated;
    });
    
    // Actualizează și array-ul simplu de ID-uri pentru compatibilitate
    setFavoriteIds((prev) => {
      if (prev.includes(id)) {
  const next = prev.filter((fid) => fid !== id);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('favorites:updated'));
  return next;
      } else {
  const next = [...prev, id];
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('favorites:updated'));
  return next;
      }
    });
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
        <div className="favorite-count">Anunțuri favorite ({announcements.length}/150)</div>
        {announcements.length === 0 ? (
          <div>Nu ai anunțuri favorite salvate.</div>
        ) : (
          <div className="favorite-announcements-list">
            {announcements.map((a) => (
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
                  <div className={`favorite-heart ${favoriteIds.includes(a._id) ? 'filled' : ''}`}
                    onClick={ev => { ev.stopPropagation(); handleToggleFavorite(a._id); }}
                  >
                    {favoriteIds.includes(a._id) ? (
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
