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
  const navigate = useNavigate();
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
            color: '#073b4c',
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
                      : `/uploads/${a.images[0].replace(/^.*[\\/]/, '')}`}
                    alt="imagine principala"
                    className="favorite-announcement-img"
                  />
                ) : (
                  <div className="favorite-announcement-img" style={{background: '#eee'}} />
                )}
              </div>
              <div className="favorite-announcement-info">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                  <span style={{color: '#355070', fontSize: 17}}>
                    {a.createdAt ? `Postat ${new Date(a.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
                  </span>
                  <div className="favorite-heart"
                    onClick={ev => { ev.stopPropagation(); handleToggleFavorite(a._id); }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {favoriteIds.includes(a._id) ? (
                      <FavoriteIcon sx={{ color: 'red', fontSize: 32 }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ color: '#355070', fontSize: 32 }} />
                    )}
                  </div>
                </div>
                <h2 className="favorite-announcement-title">{a.title}</h2>
                <div className="favorite-announcement-category">{a.category}</div>
                <div className="favorite-announcement-location">{a.location}</div>
                {a.price && <div style={{ fontWeight: 700, fontSize: 22, color: '#003b3b', marginTop: 12 }}>{a.price} €</div>}
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
