import React, { useEffect, useState } from 'react';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useParams } from 'react-router-dom';
import apiClient from '../api/api';
import './MyAnnouncements.css';

export default function AnnouncementsByCategory() {
  const { category } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const FAVORITES_KEY = userId ? `favoriteAnnouncements_${userId}` : 'favoriteAnnouncements_guest';
  const [favoriteIds, setFavoriteIds] = useState(() => {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  });

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/announcements?category=${encodeURIComponent(category)}`);
        setAnnouncements(res.data);
      } catch (e) {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, [category]);

  if (loading) return <div>Se încarcă anunțurile...</div>;

  return (
    <div className="my-announcements-container">
      <h1 className="my-announcements-title">Anunțuri pentru categoria: {category}</h1>
      {announcements.length === 0 ? (
        <div>Nu există anunțuri pentru această categorie.</div>
      ) : (
        <div className="favorite-announcements-list">
          {announcements.map((a) => (
            <div key={a._id} className="my-announcement-card" style={{ position: 'relative', cursor: 'pointer' }}
              onClick={e => {
                // Nu declanșa navigarea dacă s-a dat click pe inimă
                if (e.target.closest('.favorite-heart')) return;
                window.location.href = `/announcement/${a._id}`;
              }}
            >
              <div className="my-announcement-image">
                {a.images && a.images[0] ? (
                  <img
                    src={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                      ? a.images[0]
                      : `/uploads/${a.images[0].replace(/^.*[\\/]/, '')}`}
                    alt="imagine principala"
                    className="my-announcement-img"
                  />
                ) : (
                  <div className="my-announcement-img" style={{background: '#eee'}} />
                )}
                {/* Iconiță inimă pentru favorite */}
                <div
                  className="favorite-heart"
                  style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 16,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    zIndex: 2
                  }}
                  onClick={ev => {
                    ev.stopPropagation();
                    setFavoriteIds((prev) => {
                      let updated;
                      if (prev.includes(a._id)) {
                        updated = prev.filter((id) => id !== a._id);
                      } else {
                        updated = [...prev, a._id];
                      }
                      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
                      return updated;
                    });
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {favoriteIds.includes(a._id) ? (
                    <FavoriteIcon sx={{ color: 'red', fontSize: 32 }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ color: '#23484a', fontSize: 32 }} />
                  )}
                </div>
              </div>
              <div className="my-announcement-info">
                <div className="my-announcement-header">
                  <div>
                    <h2 className="my-announcement-title">{a.title}</h2>
                    <div className="my-announcement-category">{a.category}</div>
                    <div className="my-announcement-location">{a.location}</div>
                    {/* Descrierea a fost eliminată pentru un aspect mai curat al listei de anunțuri */}
                  </div>
                  <div className="my-announcement-id">
                    ID: {a._id?.slice(-9) || ''}
                  </div>
                </div>
                {/* Fără butoane de acțiune */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
