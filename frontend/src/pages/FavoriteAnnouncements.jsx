import React, { useEffect, useState } from 'react';
import FavoriteIcon from '@mui/icons-material/Favorite';
import apiClient from '../api/api';
import './MyAnnouncements.css';

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
      background: '#043136',
      color: '#fff',
      padding: '18px 32px',
      borderRadius: 12,
      fontSize: 24,
      fontWeight: 500,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 2px 16px rgba(0,0,0,0.12)'
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
  // Cheie unică pentru favorite per utilizator
  const userId = localStorage.getItem('userId');
  const FAVORITES_KEY = userId ? `favoriteAnnouncements_${userId}` : 'favoriteAnnouncements_guest';
  const [favoriteIds, setFavoriteIds] = useState(() => {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setAnnouncements([]);
      return;
    }
    apiClient.get(`/api/announcements`)
      .then(res => {
        setAnnouncements(res.data.filter(a => favoriteIds.includes(a._id)));
      })
      .catch(() => setAnnouncements([]));
  }, [favoriteIds, FAVORITES_KEY]);

  const handleToggleFavorite = (id) => {
    setFavoriteIds((prev) => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter((fid) => fid !== id);
        setShowToast(true);
      } else {
        updated = [...prev, id];
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="my-announcements-container">
      {showToast && <Toast message="Șters din favorite" onClose={() => setShowToast(false)} />}
      <h1 className="my-announcements-title">Anunturile tale favorite</h1>
      <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 22, margin: '32px 0 24px 0' }}>
        Anunțuri favorite ({announcements.length}/150)
      </div>
      {announcements.length === 0 ? (
        <div>Nu ai anunțuri favorite salvate.</div>
      ) : (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center'}}>
          {announcements.map((a) => (
            <div key={a._id} className="my-announcement-card" style={{ width: 370, minHeight: 420, flexDirection: 'column', position: 'relative', cursor: 'pointer' }}
              onClick={e => {
                // Nu declanșa navigarea dacă s-a dat click pe inimă
                if (e.target.closest('.favorite-heart')) return;
                window.location.href = `/announcement/${a._id}`;
              }}
            >
              <div className="my-announcement-image" style={{ minWidth: '100%', maxWidth: '100%', marginRight: 0 }}>
                {a.images && a.images[0] ? (
                  <img
                    src={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                      ? a.images[0]
                      : `/uploads/${a.images[0].replace(/^.*[\\/]/, '')}`}
                    alt="imagine principala"
                    className="my-announcement-img"
                    style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12 }}
                  />
                ) : (
                  <div className="my-announcement-img" style={{background: '#eee', width: '100%', height: 220, borderRadius: 12}} />
                )}
                <div className="favorite-heart" style={{ position: 'absolute', right: 16, bottom: 16, cursor: 'pointer', transition: 'transform 0.2s', zIndex: 2 }}
                  onClick={ev => { ev.stopPropagation(); handleToggleFavorite(a._id); }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <FavoriteIcon sx={{ color: 'red', fontSize: 32 }} />
                </div>
              </div>
              <div className="my-announcement-info" style={{ padding: 24 }}>
                <h2 className="my-announcement-title" style={{ fontSize: 22, marginBottom: 8 }}>{a.title}</h2>
                <div className="my-announcement-category" style={{ fontWeight: 500, color: '#23484a', marginBottom: 8 }}>{a.category}</div>
                <div className="my-announcement-location" style={{ color: '#23484a', marginBottom: 8 }}>{a.location}</div>
                {/* Descrierea a fost eliminată pentru un aspect mai curat al listei de favorite */}
                {a.price && <div style={{ fontWeight: 700, fontSize: 22, color: '#003b3b', marginTop: 12 }}>{a.price} €</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
