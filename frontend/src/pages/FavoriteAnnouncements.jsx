import React, { useEffect, useState } from 'react';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import './FavoriteAnnouncements.css';
import Footer from '../components/Footer';

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 1800);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed',
      top: 100,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#282828',
      color: '#ffffff',
      padding: '18px 32px',
      borderRadius: 12,
      fontSize: 24,
      fontWeight: 500,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 2px 16px rgba(63,63,63,0.18)',
      border: '1px solid #f51866'
    }}>
      <span style={{fontSize: 28, display: 'flex', alignItems: 'center'}}>
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
        // Elimină din favorite
        updated = prev.filter((item) => item.id !== id);
        setShowToast(true);
      } else {
        // Adaugă în favorite cu timestamp-ul curent
        updated = [...prev, { id, addedAt: Date.now() }];
      }
      
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
    
    // Actualizează și array-ul simplu de ID-uri pentru compatibilitate
    setFavoriteIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((fid) => fid !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  return (
    <>
      <div className="my-announcements-container">
        {showToast && <Toast message="Șters din favorite" onClose={() => setShowToast(false)} />}
        {/* Buton back */}
        <button
          className="favorite-back-btn-mobile"
          onClick={() => navigate('/')}
          aria-label="Înapoi la pagina principală"
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            color: '#f51866',
            fontSize: 22,
            fontWeight: 500,
            marginBottom: 8,
            cursor: 'pointer',
            padding: 0
          }}
        >
          <ArrowBackIcon style={{ fontSize: 28, marginRight: 8 }} />
          <span style={{ fontSize: 0 }}>Înapoi</span>
        </button>
        <h1 className="my-announcements-title">Anunturile tale favorite</h1>
        <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 22, margin: '32px 0 24px 0' }}>
          Anunțuri favorite ({announcements.length}/150)
        </div>
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
                      : `/uploads/${a.images[0].replace(/^.*[\\\/]/, '')}`}
                    alt="imagine principala"
                    className="favorite-announcement-img"
                  />
                ) : (
                  <div className="favorite-announcement-img" style={{background: '#ffebf0'}} />
                )}
              </div>
              <div className="favorite-announcement-info">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                  <span style={{color: '#717171', fontSize: 17}}>
                    {a.createdAt ? `Postat ${new Date(a.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
                  </span>
                  <div className={`favorite-heart ${favoriteIds.includes(a._id) ? 'filled' : ''}`}
                    onClick={ev => { ev.stopPropagation(); handleToggleFavorite(a._id); }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {favoriteIds.includes(a._id) ? (
                      <FavoriteIcon sx={{ fontSize: 32 }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 32 }} />
                    )}
                  </div>
                </div>
                <h2 className="favorite-announcement-title">{a.title}</h2>
                <div className="favorite-announcement-category">{a.category}</div>
                <div className="favorite-announcement-location">{a.location}</div>
                {a.price && <div style={{ fontWeight: 700, fontSize: 22, color: '#3f3f3f', marginTop: 12 }}>{a.price} €</div>}
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
